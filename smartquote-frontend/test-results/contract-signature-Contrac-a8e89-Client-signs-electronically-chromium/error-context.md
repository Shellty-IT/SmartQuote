# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "SmartQuote AI" [ref=e7]
        - heading "SmartQuote AI" [level=1] [ref=e8]
        - paragraph [ref=e9]: Zaloguj się do swojego konta
      - generic [ref=e10]:
        - img [ref=e12]
        - paragraph [ref=e15]: Serwer gotowy
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Adres email
          - generic [ref=e19]:
            - generic:
              - img
            - textbox "Adres email" [active] [ref=e20]:
              - /placeholder: jan@firma.pl
        - generic [ref=e21]:
          - generic [ref=e22]: Hasło
          - generic [ref=e23]:
            - generic:
              - img
            - textbox "Hasło" [ref=e24]:
              - /placeholder: ••••••••
        - button "Zaloguj się" [ref=e25]
      - paragraph [ref=e27]:
        - text: Nie masz konta?
        - link "Zarejestruj się" [ref=e28] [cursor=pointer]:
          - /url: /register
    - paragraph [ref=e29]:
      - text: © 2026 SmartQuote AI by
      - link "Shellty" [ref=e30] [cursor=pointer]:
        - /url: https://shellty-it.github.io/
```