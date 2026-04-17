import { Product, Category, CategoryOption, Locale } from './types'

export const products: Product[] = [
  {
    id: '1',
    name: {
      en: 'Makeup Sponge in Case – Brown',
      hy: 'Դիմահարդարման սպունգ պատյանով – Շագանակագույն',
      ru: 'Спонж для макияжа в футляре Коричневый',
    },
    shortDescription: {
      en: 'Soft latex-free makeup sponge for smooth, even foundation application.',
      hy: 'Լատեքս չպարունակող փափուկ սպունգ՝ տոնային քսուքը հարթ ու հավասար քսելու համար։',
      ru: 'Идеальное нанесение тонального крема без разводов.',
    },
    description: {
      en: 'Ultra-soft, latex-free makeup sponge for even foundation application without absorbing excess product. The beveled edge makes application easier and more precise.',
      hy: 'Ուլտրափափուկ, լատեքս չպարունակող դիմահարդարման սպունգ, որն ապահովում է տոնային քսուքի հավասար բաշխում՝ առանց ավելորդ միջոցը ներծծելու։ Կտրված եզրը քսումը դարձնում է ավելի հարմար և ճշգրիտ։',
      ru: 'Ультрамягкие спонжи для макияжа, в составе которых нет латекса, за счет этого тон распределяет равномерно, не впитывает в себя много продукта. Спонж с усеченным краем что даёт ещё более удобное нанесение.',
    },
    price: 450,
    images: [],
    videos: [],
    category: 'cosmetic_sponges',
    size: '1 pcs',
    sku: 'CSM-SP-001',
    inStock: true,
    stockQuantity: 15,
    featured: true,
    bestseller: true,
  },
  {
    id: '2',
    name: {
      en: 'Makeup Sponge in Case – Black',
      hy: 'Դիմահարդարման սպունգ պատյանով – Սև',
      ru: 'Спонж для макияжа в футляре Черный',
    },
    shortDescription: {
      en: 'Soft latex-free makeup sponge for smooth, even foundation application.',
      hy: 'Լատեքս չպարունակող փափուկ սպունգ՝ տոնային քսուքը հարթ ու հավասար քսելու համար։',
      ru: 'Идеальное нанесение тонального крема без разводов.',
    },
    description: {
      en: 'Ultra-soft, latex-free makeup sponge for even foundation application without absorbing excess product. The beveled edge makes application easier and more precise.',
      hy: 'Ուլտրափափուկ, լատեքս չպարունակող դիմահարդարման սպունգ, որն ապահովում է տոնային քսուքի հավասար բաշխում՝ առանց ավելորդ միջոցը ներծծելու։ Կտրված եզրը քսումը դարձնում է ավելի հարմար և ճշգրիտ։',
      ru: 'Ультрамягкие спонжи для макияжа, в составе которых нет латекса, за счет этого тон распределяет равномерно, не впитывает в себя много продукта. Спонж с усеченным краем что даёт ещё более удобное нанесение.',
    },
    price: 450,
    images: [],
    videos: [],
    category: 'cosmetic_sponges',
    size: '1 pcs',
    sku: 'CSM-SP-002',
    inStock: true,
    stockQuantity: 15,
    featured: true,
    bestseller: true,
  },
  {
    id: '3',
    name: {
      en: 'Nude Lip Pencil-Lipstick 01',
      hy: 'Շուրթերի նյուդ մատիտ-շրթներկ 01',
      ru: 'Карандаш-помада для губ нюдовый 01',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Стойкий карандаш для губ, чётко очерчивает контур и предотвращает растекание.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-001',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '4',
    name: {
      en: 'Nude Lip Pencil 02',
      hy: 'Շուրթերի նյուդ մատիտ 02',
      ru: 'Карандаш для губ нюдовый 02',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-002',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '5',
    name: {
      en: 'Nude Lip Pencil 03',
      hy: 'Շուրթերի նյուդ մատիտ 03',
      ru: 'Карандаш для губ нюдовый 03',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-003',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '6',
    name: {
      en: 'Nude Lip Pencil 04',
      hy: 'Շուրթերի նյուդ մատիտ 04',
      ru: 'Карандаш для губ нюдовый 04',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-004',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '7',
    name: {
      en: 'Nude Lip Pencil 102',
      hy: 'Շուրթերի նյուդ մատիտ 102',
      ru: 'Карандаш для губ нюдовый 102',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-005',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '8',
    name: {
      en: 'Nude Lip Pencil 104',
      hy: 'Շուրթերի նյուդ մատիտ 104',
      ru: 'Карандаш для губ нюдовый 104',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-006',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '9',
    name: {
      en: 'Nude Lip Pencil 106',
      hy: 'Շուրթերի նյուդ մատիտ 106',
      ru: 'Карандаш для губ нюдовый 106',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-007',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
  {
    id: '10',
    name: {
      en: 'Nude Lip Pencil 107',
      hy: 'Շուրթերի նյուդ մատիտ 107',
      ru: 'Карандаш для губ нюдовый 107',
    },
    shortDescription: {
      en: 'Long-lasting nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-008',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },
    {
    id: '11',
    name: {
      en: 'Nude Matte Lip Pencil 108',
      hy: 'Շուրթերի մատտե նյուդ մատիտ 108',
      ru: 'Карандаш для губ нюдовый матовый 108',
    },
    shortDescription: {
      en: 'Long-lasting matte nude lip pencil for precise contouring and smooth blending.',
      hy: 'Երկարակյաց մատտե նյուդ շուրթերի մատիտ՝ հստակ ուրվագծման և նուրբ շերտավորման համար։',
      ru: 'Двухтонный карандаш для эффекта омбре на губах за секунды.',
    },
    description: {
      en: 'Lip pencils in beautiful matte nude shades that do not dry out your lips. They can be used for both precise contouring and soft blending. The waxy texture glides on smoothly, while the versatile shades suit most users. They perfectly complement both daytime and evening makeup.',
      hy: 'Շուրթերի մատիտներ գեղեցիկ մատտե նյուդ երանգներով, որոնք չեն չորացնում շուրթերը։ Դրանք կարելի է օգտագործել ինչպես հստակ ուրվագծման, այնպես էլ նուրբ շերտավորման համար։ Մատիտներն ունեն մոմային հյուսվածք, փափուկ են քսվում, իսկ ունիվերսալ երանգները կհամապատասխանեն շատերին։ Դրանք հիանալի լրացնում են ինչպես առօրյա, այնպես էլ երեկոյան դիմահարդարումը։',
      ru: 'Карандаш для губ в самых красивых нюдовых матовых оттенках, не сушат губы. Можно использовать как просто контур, так и в растушевке. Карандаши для губ Morena cosmetics в самых красивых нюдовых оттенках, не сушат губы.\nМожно использовать как просто контур, так и в растушевке. Карандаши имеют восковую текстуру, очень мягкие в нанесении, все оттенки универсальны и подойдут большинству пользователей. Идеально дополнят макияж как вечерний, так и дневной.',
    },
    price: 350,
    images: [],
    videos: [],
    category: 'lip_liner',
    size: '5g',
    sku: 'CSM-LL-009',
    inStock: true,
    stockQuantity: 20,
    featured: true,
  },

  // ── Lip Gloss ────────────────────────────────────────────────────────────
  {
    id: '91',
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
    videos: [],
    category: 'lip_gloss',
    size: '5.5ml',
    sku: 'CSM-LG-001',
    inStock: true,
    stockQuantity: 18,
    featured: true,
    bestseller: true,
  },
  {
    id: '101',
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
    videos: [],
    category: 'lip_gloss',
    size: '4ml',
    sku: 'CSM-LG-002',
    inStock: true,
    stockQuantity: 9,
  },

  // ── Highlighter ──────────────────────────────────────────────────────────
  {
    id: '111',
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
    videos: [],
    category: 'highlighter',
    size: '6g',
    sku: 'CSM-LB-001',
    inStock: true,
    stockQuantity: 7,
    featured: true,
    bestseller: true,
  },
  {
    id: '121',
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
    videos: [],
    category: 'highlighter',
    size: '7g',
    sku: 'CSM-LB-002',
    inStock: true,
    stockQuantity: 11,
  },

  // ── Concealer ────────────────────────────────────────────────────────────
  {
    id: '131',
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
    videos: [],
    category: 'concealer',
    size: '6ml',
    sku: 'CSM-CO-001',
    inStock: true,
    stockQuantity: 16,
    featured: true,
    bestseller: true,
  },
  {
    id: '141',
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
    videos: [],
    category: 'concealer',
    size: '5ml',
    sku: 'CSM-CO-002',
    inStock: true,
    stockQuantity: 13,
  },
]

export const categories: CategoryOption[] = [
  {
    value: 'cosmetic_sponges',
    label: {
      en: 'Cosmetic Sponges',
      hy: 'Kosmetik Spongeнер',
      ru: 'Косметические спонжи',
    },
  },
  {
    value: 'lip_liner',
    label: {
      en: 'Lip Liner',
      hy: 'Shafertaguyi Matok',
      ru: 'Карандаш для губ',
    },
  },
  {
    value: 'blush',
    label: { en: 'Blush', hy: 'Ereseski Eranger', ru: 'Румяна' },
  },
  { value: 'stick', label: { en: 'Stick', hy: 'Stick', ru: 'Стик' } },
  {
    value: 'lip_gloss',
    label: { en: 'Lip Gloss', hy: 'Shafertaguy Blesk', ru: 'Блеск для губ' },
  },
  {
    value: 'highlighter',
    label: { en: 'Highlighter', hy: 'Lavsatsun Eranger', ru: 'Сияющие румяна' },
  },
  {
    value: 'concealer',
    label: { en: 'Concealer', hy: 'Konsilyator', ru: 'Консилер' },
  },
]

export const allSizes = [...new Set(products.map((p) => p.size))].sort()

/** Returns the localized display label for a category value */
export function getCategoryLabel(value: Category, locale: Locale): string {
  return categories.find((c) => c.value === value)?.label[locale] ?? value
}

export const getFeaturedProducts = () => products.filter((p) => p.featured)
export const getBestsellers = () => products.filter((p) => p.bestseller)
export const getProductById = (id: string) => products.find((p) => p.id === id)
export const getProductsByCategory = (category: Category) =>
  products.filter((p) => p.category === category)
