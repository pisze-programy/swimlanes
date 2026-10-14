# Syntax

Write one statement per line. Empty lines separate elements. Start a line with
`//` to add a comment.

## Title

```
title: Sign in
```

The title is optional. It shows at the top left.

## Actors

Actors come from the messages. The first actor in a message is placed first.
You do not declare actors.

## Messages

```
Source -> Target: label
```

`Source` and `Target` are actor names. `label` is the text on the arrow.

| Arrow | Meaning |
| --- | --- |
| `->` | solid line, filled head |
| `->>` | solid line, open head |
| `-x` | lost message |
| `<->` | two heads |
| `<-` | message to the left |
| `<--` | dashed, message to the left |
| `-->` | dashed |
| `-->>` | dashed, open head |
| `=>` | bold line |

Use `Two -> Two` for a self message.

The actors can be in any order. `One <- Two` and `Two -> One` are the same
message.

## Text formatting

Messages, notes, labels and the title accept:

| Markup | Result |
| --- | --- |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `_italic_` | *italic* |
| `~~strike~~` | strike |
| `` `code` `` | `code` |
| `[text](https://example.com)` | link |
| `{fas-user}` | icon |

## Icons

Icon syntax: `{set-name}`.

| Prefix | Set |
| --- | --- |
| `fas` | solid |
| `far` | regular |
| `fab` | brand |

A name without a prefix uses solid, for example `{fa-bolt}`.

Add `fa-lg` for a large icon. Add `fa-2x` for a double icon.

```
Server -> Client: {fas-bolt fa-lg} Fast
```

## Notes

```
note: one line
```

A note with no text on the first line reads the lines below it. It stops at the
next statement.

```
note:
Line one.

Line two.
```

By default a note covers the actors of the previous message. Set the start and
end actor to change the width.

```
note A, C: spans A to C
```

## Sections

```
if: label
  A -> B: message
else: other label
  A -> B: message
end
```

Use `group:` instead of `if:` to group without a condition. Sections accept one
level of nesting. Close every section with `end`.

## Dividers

```
_: thin
-: regular
--: dashed
=: bold
```

The divider uses the full width. The text after the colon is the label.

## Delay

```
...: waiting
```

The delay marks a pause in the flow.

## Auto number

```
autonumber
```

`autonumber` numbers every message from the next line. Use `autonumber 10` to
start at another number.

## Order

```
order: C, A, B
```

`order` moves the actors. Actors that are not in the list keep their position
after the listed actors.

## Alias

```
alias A: {fas-server} Backend
```

`alias` changes the text of an actor. Messages still use the original name.

## Share and save

- The URL holds the full diagram. Copy the URL to share it.
- Press **Save** to get a short link.
- Press **SVG** or **PNG** to download the image.
