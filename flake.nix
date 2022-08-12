
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    nix-npm-buildpackage.url = "github:serokell/nix-npm-buildpackage";
  };

  outputs = { self, nixpkgs, flake-utils, nix-npm-buildpackage }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [
          (import ./overlay.nix)
          nix-npm-buildpackage.overlays.default
        ];

        pkgs = (import nixpkgs {
          inherit overlays system;
          config = { allowUnfree = true; };
        });

      in {
        packages.${system} = {
          bundler-package = pkgs.bundler.package;
          bundler-docker = pkgs.bundler.docker;
        };
      }
    );
}
