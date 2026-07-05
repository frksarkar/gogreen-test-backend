import { prisma } from '../shared/prisma';
import { generateSlug } from './generateSlug';

interface CategorySeed {
	name: string;
	description?: string;
	image?: string;
	children?: CategorySeed[];
}

const categories: CategorySeed[] = [
	{
		name: 'Electronics',
		description: 'Electronic devices and accessories',
		children: [
			{ name: 'Mobile Phones', description: 'Smartphones and feature phones' },
			{ name: 'Laptops', description: 'Notebooks and ultrabooks' },
			{ name: 'Tablets', description: 'iPad and Android tablets' },
			{ name: 'Desktop Computers', description: 'Desktop PCs and all-in-ones' },
			{ name: 'Headphones & Earphones', description: 'Wired and wireless audio' },
			{ name: 'Speakers', description: 'Bluetooth and home speakers' },
			{ name: 'Smartwatches', description: 'Wearable smart devices' },
			{ name: 'Cameras', description: 'DSLR, mirrorless and action cameras' },
			{ name: 'Gaming Consoles', description: 'PlayStation, Xbox, Nintendo' },
			{ name: 'Computer Accessories', description: 'Keyboards, mice, and peripherals' },
			{ name: 'Mobile Accessories', description: 'Cases, chargers, and screen protectors' },
			{ name: 'TV & Video', description: 'LED, OLED, and smart TVs' },
			{ name: 'Home Audio', description: 'Soundbars and home theater systems' },
			{ name: 'Wearable Technology', description: 'Fitness bands and smart glasses' },
		],
	},
	{
		name: 'Fashion',
		description: 'Clothing, shoes, and accessories',
		children: [
			{ name: "Men's Clothing", description: 'Shirts, pants, suits, and casual wear' },
			{ name: "Women's Clothing", description: 'Dresses, tops, and ethnic wear' },
			{ name: "Kids' Clothing", description: 'Clothes for boys and girls' },
			{ name: "Men's Shoes", description: 'Formal, casual, and sports shoes' },
			{ name: "Women's Shoes", description: 'Heels, flats, sneakers, and sandals' },
			{ name: "Kids' Shoes", description: 'Shoes and sandals for children' },
			{ name: 'Bags & Luggage', description: 'Backpacks, handbags, and suitcases' },
			{ name: 'Accessories', description: 'Belts, hats, scarves, and gloves' },
			{ name: 'Watches', description: 'Analog, digital, and smart watches' },
			{ name: 'Jewelry', description: 'Necklaces, rings, earrings, and bracelets' },
			{ name: 'Sunglasses', description: 'Polarized and designer eyewear' },
			{ name: 'Winter Wear', description: 'Jackets, sweaters, and thermal wear' },
			{ name: 'Ethnic Wear', description: 'Traditional and cultural attire' },
			{ name: 'Sportswear', description: 'Activewear and gym clothing' },
		],
	},
	{
		name: 'Home & Kitchen',
		description: 'Furniture, decor, and kitchen essentials',
		children: [
			{ name: 'Furniture', description: 'Sofas, beds, tables, and chairs' },
			{ name: 'Home Decor', description: 'Wall art, vases, and decorative items' },
			{ name: 'Kitchen Appliances', description: 'Microwaves, blenders, and mixers' },
			{ name: 'Cookware', description: 'Pots, pans, and baking dishes' },
			{ name: 'Bedding', description: 'Sheets, pillows, and comforters' },
			{ name: 'Bathroom Accessories', description: 'Towels, mats, and organizers' },
			{ name: 'Lighting', description: 'Lamps, chandeliers, and bulbs' },
			{ name: 'Storage & Organization', description: 'Shelves, bins, and closet organizers' },
			{ name: 'Cleaning Supplies', description: 'Mops, brooms, and cleaning agents' },
			{ name: 'Tools & Hardware', description: 'Power tools, hand tools, and hardware' },
		],
	},
	{
		name: 'Beauty & Personal Care',
		description: 'Skincare, makeup, and grooming products',
		children: [
			{ name: 'Skincare', description: 'Moisturizers, serums, and cleansers' },
			{ name: 'Haircare', description: 'Shampoos, conditioners, and styling products' },
			{ name: 'Makeup', description: 'Foundation, lipstick, and eyeshadow' },
			{ name: 'Fragrances', description: 'Perfumes and body sprays' },
			{ name: 'Bath & Body', description: 'Soaps, lotions, and shower gels' },
			{ name: "Men's Grooming", description: 'Beard care, razors, and trimmers' },
			{ name: 'Nail Care', description: 'Nail polishes and manicure tools' },
			{ name: 'Beauty Tools', description: 'Hair dryers, curlers, and straighteners' },
			{ name: 'Oral Care', description: 'Toothpaste, brushes, and mouthwash' },
		],
	},
	{
		name: 'Sports & Outdoors',
		description: 'Fitness equipment, outdoor gear, and sports accessories',
		children: [
			{ name: 'Gym & Fitness', description: 'Weights, benches, and resistance bands' },
			{ name: 'Cycling', description: 'Bicycles, helmets, and cycling gear' },
			{ name: 'Outdoor Recreation', description: 'Skateboards, rollerblades, and scooters' },
			{ name: 'Team Sports', description: 'Football, cricket, basketball, and volleyball' },
			{ name: 'Swimming', description: 'Swimwear, goggles, and pool accessories' },
			{ name: 'Yoga & Pilates', description: 'Mats, blocks, and straps' },
			{ name: 'Camping & Hiking', description: 'Tents, sleeping bags, and backpacks' },
			{ name: 'Exercise Equipment', description: 'Treadmills, ellipticals, and rowing machines' },
		],
	},
	{
		name: 'Books & Stationery',
		description: 'Books, writing instruments, and office supplies',
		children: [
			{ name: 'Fiction Books', description: 'Novels, short stories, and literary fiction' },
			{ name: 'Non-Fiction Books', description: 'Biographies, history, and self-help' },
			{ name: 'Academic Books', description: 'Textbooks and reference materials' },
			{ name: "Children's Books", description: 'Picture books and early readers' },
			{ name: 'Office Stationery', description: 'Pens, paper, and notebooks' },
			{ name: 'Art Supplies', description: 'Paints, brushes, and canvases' },
			{ name: 'School Supplies', description: 'Backpacks, lunch boxes, and geometry boxes' },
		],
	},
	{
		name: 'Toys & Games',
		description: 'Toys, board games, and puzzles',
		children: [
			{ name: 'Action Figures', description: 'Superheroes and collectible figures' },
			{ name: 'Board Games', description: 'Chess, Monopoly, and card games' },
			{ name: 'Puzzles', description: 'Jigsaw puzzles and brain teasers' },
			{ name: 'Educational Toys', description: 'STEM toys and learning kits' },
			{ name: 'Remote Control Toys', description: 'RC cars, drones, and helicopters' },
			{ name: 'Dolls & Playsets', description: 'Dolls, dollhouses, and playsets' },
			{ name: 'Video Games', description: 'Game discs and digital codes' },
		],
	},
	{
		name: 'Automotive',
		description: 'Car and motorcycle accessories, parts, and care products',
		children: [
			{ name: 'Car Accessories', description: 'Seat covers, steering wheels, and phone holders' },
			{ name: 'Motorcycle Accessories', description: 'Helmets, gloves, and riding gear' },
			{ name: 'Car Care', description: 'Wax, polish, and cleaning kits' },
			{ name: 'Tools & Equipment', description: 'Car jacks, toolkits, and diagnostic tools' },
			{ name: 'Automotive Fluids', description: 'Engine oil, coolant, and brake fluid' },
			{ name: 'Interior Accessories', description: 'Floor mats, air fresheners, and organizers' },
			{ name: 'Exterior Accessories', description: 'Car covers, roof racks, and spoilers' },
		],
	},
	{
		name: 'Health & Wellness',
		description: 'Supplements, medical equipment, and personal wellness',
		children: [
			{ name: 'Vitamins & Supplements', description: 'Multivitamins, protein, and herbal supplements' },
			{ name: 'Medical Equipment', description: 'BP monitors, glucometers, and thermometers' },
			{ name: 'Personal Care', description: 'Massage guns, and wellness devices' },
			{ name: 'Fitness Trackers', description: 'Activity bands and health monitors' },
			{ name: 'Massagers', description: 'Neck, back, and foot massagers' },
			{ name: 'First Aid', description: 'First aid kits and bandages' },
		],
	},
	{
		name: 'Grocery & Gourmet Foods',
		description: 'Food, beverages, and cooking essentials',
		children: [
			{ name: 'Beverages', description: 'Tea, coffee, juices, and soft drinks' },
			{ name: 'Snacks', description: 'Chips, biscuits, and namkeen' },
			{ name: 'Cooking Essentials', description: 'Oil, spices, and condiments' },
			{ name: 'Organic Foods', description: 'Organic fruits, vegetables, and grains' },
			{ name: 'Gourmet Foods', description: 'Premium imported and specialty foods' },
			{ name: 'Dairy & Eggs', description: 'Milk, cheese, butter, and eggs' },
		],
	},
	{
		name: 'Baby & Kids',
		description: 'Baby care products, clothing, and accessories',
		children: [
			{ name: 'Diapers & Wipes', description: 'Disposable and cloth diapers' },
			{ name: 'Baby Clothing', description: 'Onesies, rompers, and baby outfits' },
			{ name: 'Baby Gear', description: 'Strollers, car seats, and baby carriers' },
			{ name: 'Nursery Furniture', description: 'Cribs, changing tables, and rocking chairs' },
			{ name: 'Baby Toys', description: 'Rattles, teethers, and activity mats' },
			{ name: 'Feeding Essentials', description: 'Bottles, bibs, and high chairs' },
			{ name: 'Baby Skincare', description: 'Baby lotion, shampoo, and diaper rash cream' },
		],
	},
	{
		name: 'Pet Supplies',
		description: 'Food, accessories, and care products for pets',
		children: [
			{ name: 'Dog Supplies', description: 'Dog food, collars, and toys' },
			{ name: 'Cat Supplies', description: 'Cat food, litter, and scratching posts' },
			{ name: 'Fish & Aquatics', description: 'Aquariums, filters, and fish food' },
			{ name: 'Pet Food', description: 'Dry and wet food for all pets' },
			{ name: 'Pet Accessories', description: 'Beds, carriers, and grooming tools' },
			{ name: 'Pet Health', description: 'Flea treatments, vitamins, and supplements' },
		],
	},
	{
		name: 'Office & Business',
		description: 'Office supplies, furniture, and business equipment',
		children: [
			{ name: 'Office Furniture', description: 'Desks, chairs, and filing cabinets' },
			{ name: 'Office Electronics', description: 'Printers, scanners, and projectors' },
			{ name: 'Office Supplies', description: 'Paper, binders, and desk organizers' },
			{ name: 'Business Equipment', description: 'Shredders, laminators, and binding machines' },
			{ name: 'Printing & Stationery', description: 'Printer ink, toners, and envelopes' },
		],
	},
	{
		name: 'Music & Instruments',
		description: 'Musical instruments and audio equipment',
		children: [
			{ name: 'Musical Instruments', description: 'Guitars, pianos, drums, and violins' },
			{ name: 'Pro Audio Equipment', description: 'Mixers, microphones, and amplifiers' },
			{ name: 'Music Accessories', description: 'Strings, picks, stands, and cases' },
			{ name: 'Studio Recording', description: 'Audio interfaces, monitors, and software' },
		],
	},
	{
		name: 'Garden & Outdoor Living',
		description: 'Gardening tools, plants, and outdoor decor',
		children: [
			{ name: 'Plants & Seeds', description: 'Indoor plants, flower seeds, and saplings' },
			{ name: 'Gardening Tools', description: 'Shovels, pruners, and watering cans' },
			{ name: 'Outdoor Decor', description: 'Garden statues, lights, and wind chimes' },
			{ name: 'Pots & Planters', description: 'Terracotta, ceramic, and plastic pots' },
			{ name: 'Watering Equipment', description: 'Hoses, sprinklers, and nozzles' },
			{ name: 'Outdoor Furniture', description: 'Benches, tables, and garden sets' },
		],
	},
];

export const seedCategory = async () => {
	try {
		const existingCategories = await prisma.productCategory.findFirst();
		if (existingCategories) {
			console.log('Categories already exist');
			return;
		}

		console.log('Seeding categories...');

		const placeholder = (name: string) =>
			`https://placehold.co/400x400/EEE/31343C?text=${encodeURIComponent(name)}`;

		for (const parentCat of categories) {
			const parentSlug = await generateSlug(parentCat.name, 'productCategory');
			const parent = await prisma.productCategory.create({
				data: {
					name: parentCat.name,
					slug: parentSlug,
					description: parentCat.description || null,
					image: parentCat.image || placeholder(parentCat.name),
				},
			});

			if (parentCat.children && parentCat.children.length > 0) {
				for (const childCat of parentCat.children) {
					const childSlug = await generateSlug(childCat.name, 'productCategory');
					await prisma.productCategory.create({
						data: {
							name: childCat.name,
							slug: childSlug,
							description: childCat.description || null,
							image: childCat.image || placeholder(childCat.name),
							parentId: parent.id,
						},
					});
				}
			}
		}

		console.log('Categories seeded successfully!');
	} catch (error) {
		console.log('Error seeding categories:', error);
	}
};
