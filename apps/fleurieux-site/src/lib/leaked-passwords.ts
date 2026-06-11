// src/lib/leaked-passwords.ts
// SEC-017 : dictionnaire local des mots de passe les plus fréquemment leakés.
//
// Source : agrégation des tops récurrents des fuites publiques (RockYou, SecLists
// "10-million-password-list-top-N", NCSC top 100k). Liste volontairement compacte
// et embarquée — aucune dépendance réseau, aucune donnée envoyée à un tiers.
//
// Le matching se fait en minuscules (voir password-policy.ts) : inutile de dupliquer
// les variantes de casse ici. Pour durcir davantage, brancher HIBP k-anonymity en
// complément (cf. commentaire dans auth.ts).

export const LEAKED_PASSWORDS: ReadonlySet<string> = new Set([
  // Numériques purs
  '123456', '12345', '123456789', '1234', '12345678', '1234567', '1234567890',
  '111111', '000000', '123123', '654321', '666666', '121212', '112233',
  '789456', '159753', '987654321', '11111111', '00000000', '222222', '999999',
  '777777', '888888', '555555', '101010', '202020', '123321', '7777777',
  '147258369', '123654', '852456', '1q2w3e4r', '1q2w3e', '1qaz2wsx', 'zaq12wsx',
  '147258', '963852', '321321', '456789', '696969', '987654', '142536',

  // Classiques
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword',
  'motdepasse', 'azerty', 'azerty123', 'qwerty', 'qwerty123', 'qwertyuiop',
  'qwerty1', 'azertyuiop', 'wxcvbn', 'wxcvbn123', 'loulou', 'doudou', 'soleil',
  'bonjour', 'coucou', 'chouette', 'nicolas', 'camille', 'thomas', 'antoine',
  'admin', 'admin123', 'admin1234', 'administrator', 'root', 'toor', 'root123',
  'letmein', 'welcome', 'welcome1', 'welcome123', 'login', 'guest', 'test',
  'test123', 'test1234', 'changeme', 'default', 'secret', 'secret123',
  'iloveyou', 'monkey', 'dragon', 'master', 'superman', 'batman', 'football',
  'baseball', 'starwars', 'pokemon', 'sunshine', 'princess', 'shadow', 'michael',
  'jennifer', 'jordan', 'hunter', 'trustno1', 'whatever', 'freedom', 'ranger',
  'harley', 'robert', 'matthew', 'daniel', 'andrew', 'joshua', 'charlie',
  'maggie', 'ginger', 'hannah', 'thunder', 'taylor', 'pepper', 'george',
  'computer', 'internet', 'samsung', 'google', 'apple', 'amazon', 'facebook',
  'tinkle', 'flower', 'liverpool', 'arsenal', 'chelsea', 'barcelona', 'juventus',
  'marseille', 'paris', 'france', 'lyon', 'liberté', 'liberte', 'bonjour123',

  // Patterns clavier & courts
  'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm', 'qazwsx', 'qweasd', 'qweqwe',
  'abc123', 'abcd1234', 'abcdef', 'a1b2c3', 'aaaaaa', 'aaaa', 'qwerty12',
  '1qazxsw2', 'zaq1zaq1', 'asd123', 'asdf', 'asdf1234', 'pass', 'pass123',
  'pass1234', 'azer', 'azerty1', 'motdepasse1', 'motdepasse123',

  // Avec années / suffixes fréquents
  'password2023', 'password2024', 'password2025', 'azerty2024', 'admin2024',
  'admin2025', 'welcome2024', 'summer2024', 'spring2024', 'soleil123',
  'fleurieux', 'fleurieux69', 'fleurieux123', 'mairie', 'mairie123',
])

export const LEAKED_PASSWORD_COUNT = LEAKED_PASSWORDS.size
