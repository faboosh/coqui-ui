from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.api import TTS
import os
import uuid
from urllib.parse import unquote
import threading
import queue

app = Flask(__name__)
CORS(app)

# Initialize TTS once at startup
tts = TTS()
MODELS = tts.list_models()
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

# Store loaded models and their status
loaded_models = {}
model_load_status = {}
model_load_queue = queue.Queue()

def load_model_worker():
    while True:
        model_name = model_load_queue.get()
        if model_name is None:  # Shutdown signal
            break
            
        try:
            print(f"Loading model: {model_name}")
            model_load_status[model_name] = {"status": "loading", "progress": 0}
            loaded_models[model_name] = TTS(model_name=model_name)
            model_load_status[model_name] = {"status": "ready", "progress": 100}
        except Exception as e:
            model_load_status[model_name] = {"status": "error", "error": str(e)}
            print(f"Error loading model {model_name}: {str(e)}")
        finally:
            model_load_queue.task_done()

# Start the model loading worker thread
model_load_thread = threading.Thread(target=load_model_worker, daemon=True)
model_load_thread.start()

@app.route('/api/models', methods=['GET'])
def get_models():
    return jsonify({"models": MODELS})

@app.route('/api/model_info', methods=['GET'])
def get_model_info():
    model_name = unquote(request.args.get('model'))
    
    # Check if model is already loaded or loading
    if model_name in model_load_status:
        status = model_load_status[model_name]
        if status["status"] == "ready":
            model = loaded_models[model_name]
            return jsonify({
                "status": "ready",
                "speakers": model.speakers if hasattr(model, 'speakers') else [],
                "emotions": getattr(model, 'emotion_ids', []),
                "languages": model.languages if hasattr(model, 'languages') else [],
                "supports_pitch": hasattr(model, 'model_config') and model.model_config.get('model_args', {}).get('use_pitch_norm', False),
                "supports_language": hasattr(model, 'languages')
            })
        return jsonify({"status": status["status"], "progress": status.get("progress", 0)})
    
    # Start loading the model
    model_load_status[model_name] = {"status": "queued", "progress": 0}
    model_load_queue.put(model_name)
    return jsonify({"status": "queued", "progress": 0})

@app.route('/api/audio/<filename>', methods=['GET'])
def get_generated_audio(filename):
    return send_file(os.path.join(TEMP_DIR, filename), mimetype='audio/wav')

@app.route('/api/generate', methods=['POST'])
def generate_speech():
    try:
        data = request.get_json()
        model_name = data['model']
        text = data['text']
        speaker = data.get('speaker')
        speed = float(data.get('speed', 1.0))
        emotion = data.get('emotion')
        pitch = data.get('pitch')
        language = data.get('language')

        # Check if model is loaded
        if model_name not in loaded_models:
            return jsonify({"error": "Model not loaded"}), 400

        model = loaded_models[model_name]
        
        # Generate unique filename
        audio_uuid = uuid.uuid4()
        output_path = os.path.join(TEMP_DIR, f"{audio_uuid}.wav")
        
        # Get model capabilities
        model_capabilities = {
            'speakers': model.speakers if hasattr(model, 'speakers') else [],
            'emotions': getattr(model, 'emotion_ids', []),
            'languages': model.languages if hasattr(model, 'languages') and model.languages else [],
            'supports_pitch': hasattr(model, 'model_config') and model.model_config.get('model_args', {}).get('use_pitch_norm', False),
            'supports_speed': hasattr(model, 'model_config') and not isinstance(model.model_config.get('model'), str),
            'supports_language': hasattr(model, 'languages')
        }

        print(model_capabilities)

        # Build kwargs based on model capabilities
        kwargs = {
            'text': text,
            'file_path': output_path,
            'speaking_rate': speed if model_capabilities['supports_speed'] else None
        }
        
        if speaker and model_capabilities['speakers']:
            if speaker in model_capabilities['speakers']:
                kwargs['speaker'] = speaker
            else:
                return jsonify({'error': f"Speaker '{speaker}' not available for this model"}), 400
                
        if emotion and model_capabilities.get('emotions'):
            if emotion in model_capabilities['emotions']:
                kwargs['emotion'] = emotion
            else:
                return jsonify({'error': f"Emotion '{emotion}' not available for this model"}), 400
                
        if pitch is not None and model_capabilities['supports_pitch']:
            kwargs['pitch'] = float(pitch)
            
        if language and model_capabilities['supports_language']:
            if language in model_capabilities['languages']:
                kwargs['language'] = language
            else:
                return jsonify({'error': f"Language '{language}' not available for this model. Available languages: {model_capabilities['languages']}"}), 400
            
        model.tts_to_file(**kwargs)
        
        return jsonify({ "id": audio_uuid })
        
    except ValueError as e:
        # Handle validation errors
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        # Log the full error for debugging
        print(f"Error generating speech: {str(e)}")
        return jsonify({'error': 'Failed to generate speech'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)