final: prev: {

  bundler = {

    package = final.buildNpmPackage {
      src = ./.;
      npmBuild = "npm run build";
    };

    serve = prev.writeShellScriptBin "serve" ''
      ${prev.nodejs}/bin/node ${final.bundler.package}/dist/index.js
    '';

    docker = prev.dockerTools.buildLayeredImage {
      name = "hello-world";
      tag = "latest";
      created = "now";
       config = {
        Env = [ "PORT=3000" ];
         Cmd = [ "${final.bundler.serve}/bin/serve" ];
      };
    };
  };

}
