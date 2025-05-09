# Modified flake.nix for development
{
  description = "Coqui TTS development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pythonEnv = pkgs.python312.withPackages (
          ps: with ps; [
            pip
            numpy
            scipy
            sounddevice
            librosa
            flask
            flask-cors
            # We'll still need torch via pip, but we can reduce what's needed
          ]
        );
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            pythonEnv
            espeak
            glib
            zlib
            stdenv.cc.cc
            stdenv.cc.cc.lib
            nodejs
            nodePackages.pnpm # Adding for React frontend management
          ];

          shellHook = ''
            # Create and activate a venv if it doesn't exist
            if [ ! -d "venv" ]; then
              ${pythonEnv}/bin/python -m venv venv
              source venv/bin/activate
              pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
              pip install coqui-tts
            else
              source venv/bin/activate
            fi

            # Ensure espeak is in the PATH
            export PATH="${pkgs.espeak}/bin:$PATH"

            # Set up separate LD_LIBRARY_PATH for Python processes only
            export PYTHON_LD_LIBRARY_PATH=${
              pkgs.lib.makeLibraryPath [
                pkgs.stdenv.cc.cc.lib
                pkgs.glib
                pkgs.zlib
                pkgs.espeak
              ]
            }

            # Create a wrapper script for python that sets LD_LIBRARY_PATH only for python
            mkdir -p ./.bin
            cat > ./.bin/python <<EOF
            #!/bin/sh
            export LD_LIBRARY_PATH=\$PYTHON_LD_LIBRARY_PATH
            exec \$VIRTUAL_ENV/bin/python "\$@"
            echo $LD_LIBRARY_PATH
            EOF
            chmod +x ./.bin/python
            export PATH="$(pwd)/.bin:\$PATH"

            echo "Coqui TTS development environment activated!"
          '';
        };
      }
    );
}
