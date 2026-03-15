import { Product, Category } from './types';

export const products: Product[] = [
  // ── Cosmetic Sponges ──────────────────────────────────────────────────────
  {
    id: '1',
    slug: 'velvet-blending-sponge',
    name: {
      en: 'Velvet Blending Sponge',
      hy: 'Velvet Խmboghich Spoнge',
      ru: 'Спонж для блендинга Velvet',
    },
    shortDescription: {
      en: 'Seamless foundation blending for a flawless, airbrushed finish.',
      hy: 'Bnakan artyun fondasioni hamar.',
      ru: 'Идеальное нанесение тонального крема без разводов.',
    },
    description: {
      en: 'The Velvet Blending Sponge expands when wet for seamless, full-coverage blending. Its unique teardrop shape reaches every contour of the face — use the flat side for large areas and the pointed tip for under-eye and nose details. Works with liquid, cream, and powder products.',
      hy: 'Velvet Blending Sponge-e urenum e khonavel lranum e anaratar, lriv ampichi hamar. Artsunakayner tsavorin hamar nayev knoyi norin hamar.',
      ru: 'Спонж Velvet расширяется при намокании для равномерного нанесения с полным покрытием. Уникальная форма капли достигает каждого контура лица.',
    },
    price: 4900,
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    ],
    category: 'cosmetic-sponges',
    size: '3 pc',
    sku: 'CSM-SP-001',
    inStock: true,
    featured: true,
    bestseller: true,
    tags: ['sponge', 'blending', 'foundation'],
  },
  {
    id: '2',
    slug: 'mini-contour-sponge-set',
    name: {
      en: 'Mini Contour Sponge Set',
      hy: 'Mini Kontur Sponge Havakacu',
      ru: 'Набор мини-спонжей для контуринга',
    },
    shortDescription: {
      en: 'Set of 3 precision sponges for contouring, highlighting, and concealing.',
      hy: '3 mnatskin sponge-i havakacu konturingi hamar.',
      ru: 'Набор из 3 точечных спонжей для контуринга, хайлайтинга и консилера.',
    },
    description: {
      en: 'This set of 3 mini sponges is designed for precision application. Use the flat wedge for blush and bronzer, the small dome for under-eye concealer, and the pointed tip for detailed contouring around the nose and lips. Latex-free and non-absorbent formula wastes zero product.',
      hy: 'Aуs 3 mini sponge-neri havakatsu nakhagitsvats е chap kirarum. Ogtagorts flat klini hamar blush ev bronzer-i, pokr dome-n akanjavoraki taraki konsileri hamar.',
      ru: 'Набор из 3 мини-спонжей для точечного нанесения. Плоский клин — для румян и бронзера, маленький купол — для консилера под глаза, острый кончик — для детального контуринга.',
    },
    price: 6500,
    discountedPrice: 4900,
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
      'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80',
    ],
    category: 'cosmetic-sponges',
    size: '3 pcs',
    sku: 'CSM-SP-002',
    inStock: true,
    tags: ['sponge', 'contour', 'set'],
  },

  // ── Lip Liner ───────────────────────────────────────────────────────────
  {
    id: '3',
    slug: 'define-lip-liner',
    name: {
      en: 'Define Lip Liner',
      hy: 'Define Shafertaguyi Matok',
      ru: 'Карандаш для губ Define',
    },
    shortDescription: {
      en: 'Long-wear lip liner that defines, shapes, and prevents feathering.',
      hy: 'Shafertagui matok, vor seghmnavoroum e shafertagoytnerov.',
      ru: 'Стойкий карандаш для губ, чётко очерчивает контур и предотвращает растекание.',
    },
    description: {
      en: 'Define Lip Liner has a creamy yet precise formula that glides on effortlessly and stays put all day. The retractable twist mechanism keeps the tip sharp without sharpening. Use to line, fill, or as a base to intensify your lipstick color. Available in 12 universally flattering shades.',
      hy: 'Define Lip Liner-i kremanov, shakem bazmagrvel e, vor khangun e anc pahtav ev mnaum e amen or. Retractable mekhaniзmon pahum e skize sep.',
      ru: 'Define Lip Liner имеет кремовую, но точную формулу, которая наносится легко и держится весь день. Выдвижной механизм сохраняет кончик острым без затачивания.',
    },
    price: 5900,
    images: [
      'https://images.unsplash.com/photo-1586495777744-4e6232bf2919?w=600&q=80',
    ],
    category: 'lip-liner',
    size: '1.2g',
    sku: 'CSM-LL-001',
    inStock: true,
    featured: true,
    tags: ['lip-liner', 'lip-liner', 'makeup'],
  },
  {
    id: '4',
    slug: 'sculpt-ombre-lip-liner',
    name: {
      en: 'Sculpt Ombré Lip Liner',
      hy: 'Sculpt Ombré Shafertaguyi Matok',
      ru: 'Карандаш для губ Sculpt Ombré',
    },
    shortDescription: {
      en: 'Dual-tone liner for effortless ombré lips in seconds.',
      hy: 'Erkguyn matok anhjard ombre shafertagoytnerи hamar.',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'The Sculpt Ombré Lip Liner features two complementary shades in one slim liner. Line with the darker shade and fill with the lighter tone to create a professionally graduated ombré look without any tools. Enriched with vitamin E for comfortable, all-day wear.',
      hy: 'Sculpt Ombré Lip Liner-e parvum e yerku lerenaram erk mek nrnagits matoki mej. Shafertagoytner muter erkangov ev lrats tonov.',
      ru: 'Карандаш Sculpt Ombré содержит два дополняющих друг друга оттенка в одном карандаше. Обведите более тёмным оттенком и залейте более светлым для профессионального эффекта омбре.',
    },
    price: 7200,
    discountedPrice: 5900,
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    ],
    category: 'lip-liner',
    size: '1.4g',
    sku: 'CSM-LL-002',
    inStock: true,
    bestseller: true,
    tags: ['lip-liner', 'ombre', 'dual-tone'],
  },

  // ── Blush ────────────────────────────────────────────────────────────────
  {
    id: '5',
    slug: 'satin-flush-blush',
    name: {
      en: 'Satin Flush Blush',
      hy: 'Satin Flush Ereseski Eranger',
      ru: 'Румяна Satin Flush',
    },
    shortDescription: {
      en: 'Finely milled powder blush for a natural, healthy-looking flush.',
      hy: 'Maнrik ereskerпneri ereseskin bnakan eranger.',
      ru: 'Тонко измельчённые пудровые румяна для естественного, здорового румянца.',
    },
    description: {
      en: 'Satin Flush Blush delivers a buildable, natural-looking flush with a satin finish. The ultra-finely milled formula blends seamlessly and lasts up to 12 hours. Available in 8 shades from soft peach to deep berry. Apply to the apples of cheeks and blend upward for a lifted effect.',
      hy: 'Satin Flush Blush apahov e shertavorel, bnakan eranger satin artyunov. Ultra-marik ereskerp formula-e khaghayabar kerchoum e ev tevi е minchev 12 jam.',
      ru: 'Satin Flush Blush обеспечивает наращиваемый, естественный румянец с атласным финишем. Тонко измельчённая формула легко растушёвывается и держится до 12 часов.',
    },
    price: 8900,
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
    ],
    category: 'blush',
    size: '5g',
    sku: 'CSM-BL-001',
    inStock: true,
    featured: true,
    tags: ['blush', 'powder', 'cheek'],
  },
  {
    id: '6',
    slug: 'rosy-glow-blush',
    name: {
      en: 'Rosy Glow Blush',
      hy: 'Rosy Glow Ereseski Eranger',
      ru: 'Румяна Rosy Glow',
    },
    shortDescription: {
      en: 'Sheer, buildable blush with a radiant finish that adapts to your skin tone.',
      hy: 'Thinner, kertsveli eranger, maшki toni hamar harchvog.',
      ru: 'Прозрачные, наращиваемые румяна с сияющим финишем, адаптирующиеся к тону кожи.',
    },
    description: {
      en: 'Rosy Glow is a unique colour-revealing blush that reacts to your skin\'s natural pH to deliver a perfectly personalised flush of colour. The lightweight gel-powder texture feels invisible on skin and builds from a subtle hint of colour to a vibrant radiant flush.',
      hy: 'Rosy Glow-e benzin erang batsahogh eranger e, vor arjanagrum e dzher maшkin bnorakin pH-in hamar katarelyal andznayin eranger.',
      ru: 'Rosy Glow — уникальные румяна, раскрывающие цвет в зависимости от естественного pH вашей кожи, обеспечивая идеально персонализированный румянец.',
    },
    price: 10500,
    discountedPrice: 8900,
    images: [
      'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80',
    ],
    category: 'blush',
    size: '4.5g',
    sku: 'CSM-BL-002',
    inStock: true,
    bestseller: true,
    tags: ['blush', 'radiant', 'ph-reactive'],
  },

  // ── Stick ────────────────────────────────────────────────────────────────
  {
    id: '7',
    slug: 'sculpt-contour-stick',
    name: {
      en: 'Sculpt Contour Stick',
      hy: 'Sculpt Kontur Stick',
      ru: 'Стик для контуринга Sculpt',
    },
    shortDescription: {
      en: 'Cream contour stick for effortless sculpting and blending.',
      hy: 'Krem kontur stick anjard skulpting ev blendingi hamar.',
      ru: 'Кремовый стик для контуринга для лёгкого скульптирования и растушёвки.',
    },
    description: {
      en: 'The Sculpt Contour Stick delivers a creamy, blendable formula that defines cheekbones, jawline, and temples with ease. The double-ended design features a contour shade on one side and a highlighting shade on the other. Buildable coverage that looks natural under any lighting.',
      hy: 'Sculpt Contour Stick-e apahov e kremov, kerchogh formula, vor seghmnavoroum e ereseskneri oske, erakhakhagits ev kangnakhits.',
      ru: 'Sculpt Contour Stick обеспечивает кремовую, растушёвываемую формулу, которая чётко очерчивает скулы, линию челюсти и виски.',
    },
    price: 9800,
    images: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80',
    ],
    category: 'stick',
    size: '8g',
    sku: 'CSM-ST-001',
    inStock: true,
    featured: true,
    tags: ['contour', 'stick', 'sculpt'],
  },
  {
    id: '8',
    slug: 'glow-highlight-stick',
    name: {
      en: 'Glow Highlight Stick',
      hy: 'Glow Highlight Stick',
      ru: 'Хайлайтер Glow Highlight Stick',
    },
    shortDescription: {
      en: 'Buttery highlighter stick with an intense lit-from-within glow.',
      hy: 'Kremov highlighter stick metsatsvats shinov.',
      ru: 'Кремовый хайлайтер-стик с интенсивным сиянием изнутри.',
    },
    description: {
      en: 'The Glow Highlight Stick has a silky, creamy formula that glides onto skin to deliver a blinding, lit-from-within glow. Swipe onto the high points of the face — cheekbones, brow bone, cupid\'s bow, and inner corners of eyes. Buildable from natural sheen to full-on sparkle.',
      hy: 'Glow Highlight Stick-i metsatsvats kremov formula-e khangun e maшkin vra lavsatsun apahov e.',
      ru: 'Glow Highlight Stick имеет шелковистую кремовую формулу, которая наносится на кожу, обеспечивая ослепительное сияние изнутри.',
    },
    price: 11200,
    discountedPrice: 8900,
    images: [
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80',
      'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=600&q=80',
    ],
    category: 'stick',
    size: '6.5g',
    sku: 'CSM-ST-002',
    inStock: true,
    bestseller: true,
    tags: ['highlight', 'stick', 'glow'],
  },

  // ── Lip Gloss ────────────────────────────────────────────────────────────
  {
    id: '9',
    slug: 'crystal-shine-lip-gloss',
    name: {
      en: 'Crystal Shine Lip Gloss',
      hy: 'Crystal Shine Shafertaguy Blesk',
      ru: 'Блеск для губ Crystal Shine',
    },
    shortDescription: {
      en: 'High-shine, non-sticky gloss for plump, glossy lips.',
      hy: 'Bard shin, kapchutyun-arabari blesk letsun shafertagoytnerи hamar.',
      ru: 'Блеск высокого сияния без липкости для пухлых, глянцевых губ.',
    },
    description: {
      en: 'Crystal Shine Lip Gloss delivers an ultra-glossy, mirror-like finish without the sticky feel. Infused with hyaluronic acid spheres that plump lips instantly and vitamin E for long-lasting comfort. The doe-foot applicator ensures precise, even application every time. Available in 15 shades.',
      hy: 'Crystal Shine Lip Gloss-e apahov e ultra-blestun, hargel-nman artyun aranc kapchutyun. Lrtsvats e hyaluronic acid-i gndaknerov, vor shtaltsnum en shafertagoytner ankalnelу.',
      ru: 'Crystal Shine Lip Gloss обеспечивает ультраглянцевый, зеркальный финиш без липкого ощущения. Содержит сферы гиалуроновой кислоты для мгновенного увеличения губ.',
    },
    price: 6800,
    images: [
      'https://images.unsplash.com/photo-1586495777744-4e6232bf2919?w=600&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    ],
    category: 'lip-gloss',
    size: '5.5ml',
    sku: 'CSM-LG-001',
    inStock: true,
    featured: true,
    bestseller: true,
    tags: ['lip-gloss', 'shine', 'plump'],
  },
  {
    id: '10',
    slug: 'tinted-plump-gloss',
    name: {
      en: 'Tinted Plump Gloss',
      hy: 'Tinted Plump Shafertaguy Blesk',
      ru: 'Тинтированный увеличивающий блеск',
    },
    shortDescription: {
      en: 'Tinted gloss with a plumping peptide complex for fuller-looking lips.',
      hy: 'Tinted blesk shtaltsnogh peptide kompleksov.',
      ru: 'Тинтированный блеск с пептидным комплексом для более пухлых губ.',
    },
    description: {
      en: 'Tinted Plump Gloss combines a sheer wash of color with a powerful peptide-plumping complex. The formula stimulates collagen to volumize lips over time while delivering an immediate plumping sensation. Buildable color from a barely-there tint to a bold glossy statement.',
      hy: 'Tinted Plump Gloss-e miavayrvoum e eranguytни petki lavatsumov ev hatvakan peptide-shtaltsmak kompleksov. Formula-e drdroum e kollagen nkeghits jerker vra.',
      ru: 'Tinted Plump Gloss сочетает прозрачный цвет с мощным пептидным комплексом для увеличения губ. Формула стимулирует коллаген для придания губам объёма со временем.',
    },
    price: 7900,
    discountedPrice: 6200,
    images: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    ],
    category: 'lip-gloss',
    size: '4ml',
    sku: 'CSM-LG-002',
    inStock: true,
    tags: ['lip-gloss', 'tinted', 'plumping'],
  },

  // ── Highlighter ───────────────────────────────────────────────────────
  {
    id: '11',
    slug: 'aurora-highlighter',
    name: {
      en: 'Aurora Highlighter',
      hy: 'Aurora Lavsatsun Ereseski Eranger',
      ru: 'Сияющие румяна Aurora',
    },
    shortDescription: {
      en: 'Illuminating blush that gives cheeks a sun-kissed, glowing flush.',
      hy: 'Lavsatsun eranger, vor ereseskin artarov pokhatel arev-hamboyreli lavsatsum.',
      ru: 'Сияющие румяна, придающие щекам загорелый, светящийся румянец.',
    },
    description: {
      en: 'Aurora Highlighter is infused with micro-fine pearl pigments that catch the light for a breathtaking glow. The airy, buildable formula layers beautifully for day to glam night looks. The pearlescent finish makes skin look lit-from-within without looking glittery or overdone.',
      hy: 'Aurora Highlighter-e lrtsvats e micro-marik khuzan pigmentneriov, vor lousa bzhum en areknayin lavsatsumov. Thinner, kertsveli formula-e garunakayorin shoghov.',
      ru: 'Aurora Highlighter содержит микрочастицы жемчужных пигментов, улавливающих свет для захватывающего сияния. Лёгкая, наращиваемая формула красиво накладывается.',
    },
    price: 12500,
    discountedPrice: 9900,
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    ],
    category: 'highlighter',
    size: '6g',
    sku: 'CSM-LB-001',
    inStock: true,
    featured: true,
    bestseller: true,
    tags: ['highlighter', 'highlight', 'glow'],
  },
  {
    id: '12',
    slug: 'golden-hour-highlighter',
    name: {
      en: 'Golden Hour Highlighter',
      hy: 'Golden Hour Lavsatsun Ereseski Eranger',
      ru: 'Сияющие румяна Golden Hour',
    },
    shortDescription: {
      en: 'Warm-toned, luminous blush for a bronzed, radiant complexion.',
      hy: 'Jtuts-tonayin lavsatsun eranger bronzatayin lavsatsum.',
      ru: 'Тёплые сияющие румяна для бронзового сияющего цвета лица.',
    },
    description: {
      en: 'Golden Hour captures the warmth of a sunset in a single compact. The dual-tone formula blends coral and gold pigments to create a customisable bronzed flush. Sweep across cheekbones and temples for a sun-kissed warmth. The long-lasting formula holds up to 10 hours without touch-ups.',
      hy: 'Golden Hour-e artarov yerekeyan tsaghikner e mi kompacktum. Erkguyn-ton formula-e kertsnum e coral ev voske pigmentnerin.',
      ru: 'Golden Hour передаёт тепло закатного солнца в одном компакте. Двухтонная формула смешивает коралловые и золотистые пигменты для настраиваемого бронзового румянца.',
    },
    price: 13900,
    images: [
      'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80',
    ],
    category: 'highlighter',
    size: '7g',
    sku: 'CSM-LB-002',
    inStock: true,
    tags: ['highlighter', 'bronze', 'warm'],
  },

  // ── Concealer ────────────────────────────────────────────────────────────
  {
    id: '13',
    slug: 'full-cover-concealer',
    name: {
      en: 'Full Cover Concealer',
      hy: 'Full Cover Konsilyator',
      ru: 'Консилер Full Cover',
    },
    shortDescription: {
      en: 'Full-coverage concealer that hides dark circles, blemishes, and redness.',
      hy: 'Lriv amplkuman konsilyator, vor tsatskoum e mut salborer ev katarer.',
      ru: 'Консилер с полным покрытием для скрытия тёмных кругов, несовершенств и покраснений.',
    },
    description: {
      en: 'Full Cover Concealer delivers flawless, buildable coverage that feels weightless on skin. The creamy formula blends effortlessly and sets to a natural matte finish that lasts all day without creasing. Enriched with light-reflecting pigments to brighten under-eye areas. Available in 20 shades.',
      hy: 'Full Cover Concealer-e apahov e angasherd, kertsveli amplkum, vor karcraguin e maшkin vra. Kremov formula-e kerchoum e anjard ev paymum e bnakan matte artyun.',
      ru: 'Full Cover Concealer обеспечивает безупречное, наращиваемое покрытие, которое ощущается невесомым на коже. Кремовая формула легко растушёвывается и фиксируется в естественном матовом финише.',
    },
    price: 9500,
    discountedPrice: 7900,
    images: [
      'https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=600&q=80',
      'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80',
    ],
    category: 'concealer',
    size: '6ml',
    sku: 'CSM-CO-001',
    inStock: true,
    featured: true,
    bestseller: true,
    tags: ['concealer', 'full-coverage', 'dark-circles'],
  },
  {
    id: '14',
    slug: 'brightening-eye-concealer',
    name: {
      en: 'Brightening Eye Concealer',
      hy: 'Brightening Akanjavoraki Konsilyator',
      ru: 'Осветляющий консилер для глаз',
    },
    shortDescription: {
      en: 'Lightweight concealer with optical brighteners for instantly awake eyes.',
      hy: 'Thinner konsilyator optikakan lavsatsumnerоv akнkali aknkeri hamar.',
      ru: 'Лёгкий консилер с оптическими осветлителями для мгновенно бодрых глаз.',
    },
    description: {
      en: 'Brightening Eye Concealer uses light-diffusing technology to blur imperfections and lift dark shadows under the eyes. The silky, cushion-like formula is infused with caffeine to reduce puffiness and peptides to firm the under-eye area over time. Crease-proof formula lasts up to 16 hours.',
      hy: 'Brightening Eye Concealer-e ogtagorcoum e ari-taragrum texnologia katareler khchkelov ev mut shaghner barcrelov akanchavoraki nakateri tak. Kremov formula-e lrtsvats e kafein-ov.',
      ru: 'Brightening Eye Concealer использует технологию рассеивания света для сглаживания несовершенств и осветления тёмных теней под глазами. Шелковистая, подушкообразная формула содержит кофеин.',
    },
    price: 10900,
    images: [
      'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600&q=80',
      'https://images.unsplash.com/photo-1571781565036-d3f759be73e4?w=600&q=80',
    ],
    category: 'concealer',
    size: '5ml',
    sku: 'CSM-CO-002',
    inStock: true,
    tags: ['concealer', 'brightening', 'eye'],
  },
];

export const categories: { value: string; label: { en: string; hy: string; ru: string } }[] = [
  { value: 'cosmetic-sponges', label: { en: 'Cosmetic Sponges', hy: 'Kosmetik Spongeнер', ru: 'Косметические спонжи' } },
  { value: 'lip-liner',       label: { en: 'Lip Liner',       hy: 'Shafertaguyi Matok',  ru: 'Карандаш для губ' } },
  { value: 'blush',            label: { en: 'Blush',            hy: 'Ereseski Eranger',    ru: 'Румяна' } },
  { value: 'stick',            label: { en: 'Stick',            hy: 'Stick',               ru: 'Стик' } },
  { value: 'lip-gloss',        label: { en: 'Lip Gloss',        hy: 'Shafertaguy Blesk',   ru: 'Блеск для губ' } },
  { value: 'highlighter',   label: { en: 'Highlighter',   hy: 'Lavsatsun Eranger',   ru: 'Сияющие румяна' } },
  { value: 'concealer',        label: { en: 'Concealer',        hy: 'Konsilyator',         ru: 'Консилер' } },
];

export const allSizes = [...new Set(products.map((p) => p.size))].sort();

export const getFeaturedProducts = () => products.filter((p) => p.featured);
export const getBestsellers = () => products.filter((p) => p.bestseller);
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (category: Category) =>
  products.filter((p) => p.category === category);
