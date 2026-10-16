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
          # and yes we sudo docker dis bitch ain't gonna add my user to the docker group
          nodelink = "sudo docker run --rm --name nodelink -p 2333:3000 -e NODELINK_API_ENABLELOADSTREAMENDPOINT=true performanc/nodelink:3.9.0";
          pane = cmd: "'trap : INT; ${cmd}; exec $SHELL'";
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.tmux pkgs.nodejs_26 ];
            shellHook = ''
              tmux new-session ${pane "npm i && npm run dev"} \; split-window -h ${pane nodelink} \; set -g mouse on
              exit
            '';
          };
        }
      );

      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt-rfc-style);
    };
}
