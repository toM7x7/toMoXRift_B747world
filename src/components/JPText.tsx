import { Text } from '@react-three/drei'
import { useXRift } from '@xrift/world-components'
import type { ComponentProps } from 'react'

// Bundled Japanese font subset (public/NotoSansJP-Subset.woff).
// Regenerate with subset-font.py after changing any display text —
// the subset only contains glyphs that appear in the source files.
export const JP_FONT_PATH = 'NotoSansJP-Subset.woff'

// drei <Text> with the bundled Japanese font. Using a bundled font keeps
// rendering self-contained: no runtime fetches to external font CDNs,
// which the XRift sandbox does not allow without declared permissions.
export function JPText(props: ComponentProps<typeof Text>) {
  const { baseUrl } = useXRift()
  return <Text font={`${baseUrl}${JP_FONT_PATH}`} {...props} />
}
