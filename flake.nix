{
  description = "Songascribe development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          # NodeLink listens on 3000 by default (same as Nuxt), so expose it on 2333.
          nodelink = "sudo docker run --rm --name nodelink -p 2333:3000 -e NODELINK_API_ENABLELOADSTREAMENDPOINT=true performanc/nodelink:3.9.0";
        in
         {
          default = pkgs.mkShell {
            packages = [ pkgs.tmux ];
            shellHook = ''
              sudo docker rm -f nodelink >/dev/null 2>&1
              TMUX= tmux -L songascribe new-session -s songascribe "npm i && npm run dev; tmux kill-session" \; set mouse on \; split-window -h "${nodelink}" \; select-pane -L
              sudo docker stop nodelink >/dev/null 2>&1
              exit
            '';
          };
        }
      );

      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);
    };
}
