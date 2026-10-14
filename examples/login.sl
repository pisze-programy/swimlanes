title: Sign in

alias Browser: {fas-window-maximize fa-lg} Browser
alias Server: {fas-server fa-lg} Server

Browser -> Server: POST /login
Server -> Server: Verify password

if: Password valid
  Server -> Browser: 200 + token
else: Password invalid
  Server -> Browser: 401
  Browser -> Browser: Show error
end

note Browser, Server: The token is stored in a cookie
