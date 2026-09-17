{
  description = "community-chat development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = with pkgs; [
          nodejs_22
          pnpm
          prisma-engines_7
          openssl
        ];

        shellHook = ''
          echo "╭────────────────────────────────────╮"
          echo "│  community-chat development shell  │"
          echo "╰────────────────────────────────────╯"
          echo
          echo "Node:   $(node --version)"
          echo "pnpm:   $(pnpm --version)"
          echo
        '';
      };
    };
}
