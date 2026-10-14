title: Full syntax

_: **Messages**

One -> Two: Simple
Two ->> Three: Open arrow
Three -x Four: Lost message
Three <-> Four: Bi-directional
Two -> Two: To self
Two -> One: Actors can be in any order
One <- Two: Regular, sent left
Two <-- Three: Dashed
Two => Three: Bold
One -> Four: Markdown: *italic*, **bold**, ~~strike~~, `code`, {fas-bolt}
autonumber

_: **Notes**

note: A note spans the previous message by default
note One, Three: Set the start and end actor to change the width
note:
A note can span several lines.

Blank lines are kept.

_: **Sections**

if: Conditional flow
Two -> Three: Message
else: Alternative flow
Two -> One: Message
else: Sections nest one level
if: Inner condition
Two -> Three: Message
end
end

group: Grouping
Two -> Three: Message
end

_: **Dividers**

-: Regular
--: Dashed
=: Bold

_: **Delay**

...: Waiting
