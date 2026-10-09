const handDesc = {
  0: 'Sin ninguna combinación: manda la carta más alta.',
  1: 'Dos cartas del mismo valor.',
  2: 'Dos parejas distintas.',
  3: 'Tres cartas del mismo valor.',
  4: 'Cinco cartas seguidas de palos distintos.',
  5: 'Cinco cartas del mismo palo, sin importar el orden.',
  6: 'Un trío más una pareja.',
  7: 'Cuatro cartas del mismo valor.',
  8: 'Cinco cartas seguidas y del mismo palo.',
  9: 'A, K, Q, J y 10 del mismo palo. La mejor mano posible.',
} as Record<number, string>;

export default handDesc;
