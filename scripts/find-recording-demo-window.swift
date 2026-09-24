import Foundation
import CoreGraphics

let targetNames = [
  "Opportunity Pet Recording Demo",
  "Opportunity Pet"
]

guard let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] else {
  fputs("Unable to read window list\n", stderr)
  exit(1)
}

for window in windowList {
  guard
    let owner = window[kCGWindowOwnerName as String] as? String,
    owner == "Electron",
    let name = window[kCGWindowName as String] as? String,
    targetNames.contains(name),
    let number = window[kCGWindowNumber as String] as? NSNumber
  else {
    continue
  }

  print(number.intValue)
  exit(0)
}

fputs("No matching window found\n", stderr)
exit(1)
