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
    };

    serve = prev.writeShellScriptBin "serve" ''
      ${prev.nodejs}/bin/node ${final.bundler.package}/dist/index.js
    '';

    docker = prev.dockerTools.buildLayeredImage {
      name = "bundler";
      tag = "latest";
      created = "now";
       config = {
        Env = [ "PORT=3000" ];
         Cmd = [ "${final.bundler.serve}/bin/serve" ];
      };
    };
  };

}
