final: prev: {

  bundler = {

    package = final.buildNpmPackage {
      src = ./.;
      npmBuild = "npm run build";
      extraEnvVars = {
        PYTHON = "${prev.python3}/bin/python";
      };
      buildInputs = [
        prev.nodePackages.node-gyp
        prev.nodePackages.node-pre-gyp
        prev.sqlite
      ];

      postInstall = ''
        cp -rf dist $out
      '';

    };

    serve = prev.writeShellScriptBin "serve" ''
      ${prev.nodejs}/bin/node ${final.bundler.package}/dist/index.js
    '';

    docker = prev.dockerTools.buildLayeredImage {
      name = "bundler-ecr";
      tag = "latest";
      created = "now";
       config = {
        Env = [ "PORT=3000" ];
         Cmd = [ "${final.bundler.serve}/bin/serve" ];
      };
    };
  };

  export-bundles = {

    # package is the same as bundler, just different entrypoint
    start = prev.writeShellScriptBin "start" ''
      ${prev.nodejs}/bin/node ${final.bundler.package}/dist/export-bundles/index.js
    '';

    docker = prev.dockerTools.buildLayeredImage {
      name = "export-bundles-ecr";
      tag = "latest";
      created = "now";
      config = {
        Cmd = [ "${final.export-bundles.start}/bin/start" ];
      };
    };
  };
}
