{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { nixpkgs, ... }:
    let
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
    in {
      devShells.x86_64-linux.default = pkgs.mkShell {
        packages = [
          pkgs.ruby_3_3
          pkgs.bundler
          pkgs.gcc
          pkgs.gnumake
          pkgs.pkg-config
        ];
      };
    };
}
