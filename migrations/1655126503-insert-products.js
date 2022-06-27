const productDatabase = [
  {
    name: 'sun',
    description:
      'Overview. Our Sun is a 4.5 billion-year-old star – a hot glowing ball of hydrogen and helium at the center of our solar system. The Sun is about 93 million miles (150 million kilometers) from Earth, and without its energy, life as we know it could not exist here on our home planet.',
    price: 140000,
    currency: 'cheap plate',
    imagepath: '/sun.png',
    quantity: 3,
  },
  {
    name: 'moon',
    description:
      "The Moon is Earth's only natural satellite and the fifth largest moon in the solar system. The Moon's presence helps stabilize our planet's wobble and moderate our climate. The Moon's distance from Earth is about 240,000 miles (385,000km). The Moon has a very thin atmosphere called an exosphere.",
    price: 209000,
    currency: 'pesos',
    imagepath: '/moon.png',
    quantity: 6,
  },
  {
    name: 'earth',
    description:
      "Earth is an oblate spheroid. This means it is spherical in shape, but not perfectly round. It has a slightly greater radius at the Equator, the imaginary line running horizontally around the middle of the planet. In addition to bulging in the middle, Earth's poles are slightly flattened.",
    price: 345000,
    currency: 'kilograms',
    imagepath: '/moon.png',
    quantity: 4,
  },
  {
    name: 'jupiter',
    description:
      "Jupiter is covered in swirling cloud stripes. It has big storms like the Great Red Spot, which has been going for hundreds of years. Jupiter is a gas giant and doesn't have a solid surface, but it may have a solid inner core about the size of Earth. Jupiter also has rings, but they're too faint to see very well.",
    price: 1234000,
    currency: ' burger',
    imagepath: '/moon.png',
    quantity: 3,
  },
  {
    name: 'saturn',
    description:
      "Saturn is a gas giant made up mostly of hydrogen and helium. Saturn's volume is greater than 760 Earths, and it is the second most massive planet in the solar system, about 95 times Earth's mass. The Ringed Planet is the least dense of all the planets, and is the only one less dense than water",
    price: 254000,
    currency: 'attentions and love',
    imagepath: '/saturn.png',
    quantity: 1,
  },
  {
    name: 'mars',
    description:
      "Mars is sometimes called the Red Planet. It's red because of rusty iron in the ground. Like Earth, Mars has seasons, polar ice caps, volcanoes, canyons, and weather. It has a very thin atmosphere made of carbon dioxide, nitrogen, and argon.",
    price: 1432000,
    currency: ' infant child',
    imagepath: '/moon.png',
    quantity: 2,
  },
];

exports.up = async (sql) => {
  await sql`
 INSERT INTO products ${sql(
   productDatabase,
   'name',
   'description',
   'price',
   'currency',
   'imagepath',
   'quantity',
 )}
 `;
};

exports.down = async (sql) => {
  for (const product of productDatabase) {
    await sql`
		DELETE FROM
			products
		WHERE
		 name =${product.name} and
		 description =${product.description} and
		 price =${product.price} and
		 currency =${product.currency} and
		 imagepath =${product.imagepath} and
		 quantity =${product.quantity}
		`;
  }
};
