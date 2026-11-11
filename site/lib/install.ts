/** The two one-line installs. The Action line fetches the workflow file this site serves at /upkeep.yml. */
export const actionLine = (site: string) =>
  `mkdir -p .github/workflows && curl -fsSL ${site}/upkeep.yml -o .github/workflows/upkeep.yml`

export const CLI_LINE = "npx github:dshak1/upkeep init"
