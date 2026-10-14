title: Payment retry

autonumber

Client -> Gateway: Charge {fas-credit-card}
Gateway -> Bank: Authorise

if: Bank approves
  Bank -> Gateway: Approved
  Gateway -> Client: 200
else: Bank is busy
  Bank -> Gateway: 503
  ...: Back off and retry
  Gateway -> Bank: Authorise
  note Gateway, Bank: Retry up to three times
end
