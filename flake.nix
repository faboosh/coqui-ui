{
  description = "Coqui TTS development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    poetry2nix = {
      url = "github:nix-community/poetry2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      poetry2nix,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        inherit (poetry2nix.lib.mkPoetry2Nix { inherit pkgs; })
          mkPoetryEnv
          overrides
          ;

        customOverrides =
          self: super:
          let
            # Helper to add setuptools to gruut packages
            addSetuptoolsToGruut =
              name: pkg:
              if pkgs.lib.hasPrefix "gruut" name then
                pkg.overridePythonAttrs (old: {
                  nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ [ self.setuptools ];
                  buildInputs = (old.buildInputs or [ ]) ++ [ self.setuptools ];
                  doCheck = false;
                })
              else
                pkg;
          in
          pkgs.lib.mapAttrs addSetuptoolsToGruut super
          // {
            coqui-tts = super.coqui-tts.overridePythonAttrs (old: {
              buildInputs = (old.buildInputs or [ ]) ++ [ self.setuptools ];
              doCheck = false;
            });

            encodec = super.encodec.overridePythonAttrs (old: {
              buildInputs = (old.buildInputs or [ ]) ++ [ self.setuptools ];
              doCheck = false;
            });

            torchaudio = super.torchaudio.overridePythonAttrs (old: {
              doCheck = false;
            });
          };

        pythonEnv = mkPoetryEnv {
          projectDir = self;
          python = pkgs.python311;
          overrides = overrides.withDefaults customOverrides;
          preferWheels = true;
        };

        frontendBuild = pkgs.buildNpmPackage {
          name = "coqui-ui-frontend";
          src = ./coqui-ui;

          npmDepsHash = "sha256-Y+I60unQXqs6JLxZaqJhZ+uZENhEibHyiDY/Y6SHHHk=";

          npmBuildScript = "build";

          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/
          '';
        };

        pythonLibraryPath = pkgs.lib.makeLibraryPath [
          pkgs.stdenv.cc.cc.lib
          pkgs.glib
          pkgs.zlib
          pkgs.espeak
        ];

        # Create script to run Python with the right environment
        pythonRun = pkgs.writeShellScriptBin "python-run" ''
          #!/bin/sh
          export LD_LIBRARY_PATH=${pythonLibraryPath}
          export PATH="${pkgs.espeak}/bin:$PATH"
          python "$@"
        '';

        # Create script to start the Flask app
        startFlask = pkgs.writeShellScriptBin "start-flask" ''
          #!/bin/sh
          python-run main.py
        '';

        # Create script to start both frontend and backend
        startDev = pkgs.writeShellScriptBin "start-dev" ''
          #!/bin/sh
          # Start Flask in the background

          DEBUG=true python-run main.py &
          FLASK_PID=$!

          # Start React frontend
          cd coqui-ui
          npm run dev

          # When React is stopped, also stop Flask
          kill $FLASK_PID
        '';

        nixosModule =
          {
            config,
            lib,
            pkgs,
            ...
          }:
          with lib;
          let
            cfg = config.services.coqui-tts;
          in
          {
            options.services.coqui-tts = {
              enable = mkEnableOption "Coqui TTS web application";
              port = mkOption {
                type = types.int;
                default = 5000;
                description = "Port to listen on";
              };
              dataDir = mkOption {
                type = types.str;
                default = "/var/lib/coqui-tts";
                description = "Directory to store temporary files";
              };
            };

            config = mkIf cfg.enable {
              systemd.services.coqui-tts = {
                description = "Coqui TTS Web Application";
                wantedBy = [ "multi-user.target" ];
                after = [ "network.target" ];

                serviceConfig = {
                  ExecStart = "${self.packages.${pkgs.system}.default}/bin/coqui-tts-app";
                  Restart = "on-failure";
                  User = "coqui-tts";
                  Group = "coqui-tts";

                  # Set up the data directory
                  StateDirectory = "coqui-tts";
                  StateDirectoryMode = "0755";
                  Environment = [
                    "COQUI_TTS_TEMP_DIR=${cfg.dataDir}/temp"
                    "COQUI_TTS_PORT=${toString cfg.port}"
                  ];
                };
              };

              users.users.coqui-tts = {
                isSystemUser = true;
                group = "coqui-tts";
                description = "Coqui TTS service user";
              };

              users.groups.coqui-tts = { };
            };
          };

      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            pythonEnv
            espeak
            glib
            zlib
            nodejs
            nodePackages.pnpm
            pythonRun
            startFlask
            startDev
          ];

          shellHook = ''
            export PATH="${pkgs.espeak}/bin:$PATH"
            echo "Coqui TTS development environment activated!"
            echo "Run 'start-flask' to start the Flask app"
            echo "Run 'start-dev' to start both Flask and React"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation {
          name = "coqui-tts-app";
          src = self;

          buildInputs = with pkgs; [
            pythonEnv
            espeak
            glib
            zlib
            nodejs
            nodePackages.pnpm
          ];

          buildPhase = ''
            # Set up Python environment

            # Prepare app directory
            mkdir -p $out/lib/coqui-tts
            mkdir -p $out/bin

            # Copy the Flask app
            cp main.py $out/lib/coqui-tts/

            # Copy pre-built frontend
            mkdir -p $out/lib/coqui-tts/static
            cp -r ${frontendBuild}/* $out/lib/coqui-tts/static/

          '';

          installPhase = ''
            # Create runner script
            cat > $out/bin/coqui-tts-app <<EOF
            #!/bin/sh

            export PATH="${pkgs.espeak}/bin:\$PATH"
            LD_LIBRARY_PATH=${pythonLibraryPath}

            # Get port from environment or use default
            export COQUI_TTS_PORT="\''${COQUI_TTS_PORT:-5000}"

            # Set TEMP_DIR to a configurable location
            export COQUI_TTS_TEMP_DIR="\''${COQUI_TTS_TEMP_DIR:-/tmp/coqui-tts}"
            mkdir -p "\$COQUI_TTS_TEMP_DIR"

            # Activate the venv and run the app
            cd $out/lib/coqui-tts
            python main.py
            EOF

            chmod +x $out/bin/coqui-tts-app
          '';
        };

      }
      // {
        inherit nixosModule;
      }
    );
}
