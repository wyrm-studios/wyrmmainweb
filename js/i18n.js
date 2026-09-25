/* ==============================================================================
   WYRM.studios — i18n Language Switcher (EN / FR / AR)
   English is the default. The globe icon in the nav cycles EN → FR → AR.
   Arabic flips the document to RTL. Choice persists in localStorage.

   HOW IT WORKS
   - Text-node translation: walks every text node and swaps it by normalized
     match, so nested markup (<br>, spans) survives untouched.
   - Originals are captured once (WeakMap); every switch translates FROM the
     English original, so FR→AR→EN round-trips are lossless.
   - Loaded FIRST in the script stack (before scroll-animations) so the
     word-by-word hero reveal animates the already-translated text.
   ============================================================================== */

(function () {
    'use strict';

    var LANGS = ['en', 'fr', 'ar'];
    var CODES = { en: 'EN', fr: 'FR', ar: 'AR' };
    var STORAGE_KEY = 'wyrm-lang';

    function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

    /* ------------------------------------------------------------------ *
       TEXT MAP — [exact english text, français, العربية]
       Matching is whitespace-normalized, so line wraps in the HTML
       source never break a match.
     * ------------------------------------------------------------------ */
    var M = [
        /* ---- shared nav ---- */
        ['Home', 'Accueil', 'الرئيسية'],
        ['Work', 'Projets', 'أعمالنا'],
        ['About', 'À propos', 'من نحن'],
        ['Blog', 'Blog', 'المدونة'],
        ['Shop', 'Boutique', 'المتجر'],
        ['Start a Project', 'Démarrer un projet', 'ابدأ مشروعك'],
        ['Start', 'Démarrer', 'ابدأ'],

        /* ---- shared footer ---- */
        ['Full-service creative studio — brand identity, motion design, video editing, logos, and web experiences for companies that refuse to blend in.',
         'Studio créatif complet — identité de marque, motion design, montage vidéo, logos et expériences web pour les entreprises qui refusent de passer inaperçues.',
         'استوديو إبداعي متكامل — هويات علامات، موشن ديزاين، مونتاج فيديو، شعارات، وتجارب ويب للشركات التي ترفض أن تكون كغيرها.'],
        ['EXPLORE', 'EXPLORER', 'استكشف'],
        ['SERVICES', 'SERVICES', 'خدماتنا'],
        ['CONNECT', 'CONTACT', 'تواصل'],
        ['Tunisia — working worldwide', 'Tunisie — une portée mondiale', 'تونس — نعمل حول العالم'],
        ['Brand Identity', 'Identité de marque', 'هوية العلامة'],
        ['Motion Design', 'Motion design', 'موشن ديزاين'],
        ['Video Editing', 'Montage vidéo', 'مونتاج الفيديو'],
        ['Web Design', 'Web design', 'تصميم المواقع'],
        ['Creative Direction', 'Direction créative', 'توجيه إبداعي'],
        ['Have a Project in mind ?', 'Un projet en tête ?', 'لديك مشروع في بالك؟'],
        ['Want to be the next case study?', 'Envie d’être la prochaine étude de cas ?', 'تريد أن تكون دراسة الحالة التالية؟'],
        ['Create different', 'Créer la différence', 'اصنع شيئًا مختلفًا'],
        ['© 2026 WYRM.studios. All rights reserved.', '© 2026 WYRM.studios. Tous droits réservés.', '© 2026 WYRM.studios. جميع الحقوق محفوظة.'],
        ['Built by Wyrm Studios', 'Conçu par Wyrm Studios', 'من بناء Wyrm Studios'],
        ['Terms', 'Conditions', 'الشروط'],
        ['Privacy', 'Confidentialité', 'الخصوصية'],

        /* ---- index hero ---- */
        ['We\'re wyrm.studios', 'Nous sommes wyrm.studios', 'نحن wyrm.studios'],
        ['an independent creative studio.', 'un studio créatif indépendant.', 'استوديو إبداعي مستقل.'],
        ['We build brands people remember.', 'Nous construisons des marques inoubliables.', 'نصنع علامات لا تُنسى.'],
        ['Cinematic Brand Experiences', 'Des expériences de marque cinématographiques', 'تجارب علامة تجارية سينمائية'],
        ['That make your brand impossible to ignore', 'Qui rendent votre marque impossible à ignorer', 'تجعل علامتك مستحيلة التجاهل'],
        ['Based in Tunisia — working worldwide', 'Basés en Tunisie — une portée mondiale', 'مقرنا تونس — ونعمل حول العالم'],
        ['Full-service creative studio crafting brand identities, motion design, video editing, logos, and web experiences for companies that refuse to blend in.',
         'Studio créatif complet : identités de marque, motion design, montage vidéo, logos et expériences web pour les entreprises qui refusent de passer inaperçues.',
         'استوديو إبداعي متكامل يصنع هويات العلامات، وموشن ديزاين، ومونتاج الفيديو، والشعارات، وتجارب الويب للشركات التي ترفض أن تشبه الجميع.'],
        ['See Case Studies', 'Voir les études de cas', 'شاهد دراسات الحالة'],

        /* ---- trusted strip ---- */
        ['Based in Tunisia, trusted by more than', 'Basés en Tunisie, plus de', 'مقرنا تونس، ويثق بنا أكثر من'],
        ['66 clients', '66 clients', '66 عميلاً'],
        ['worldwide', 'à travers le monde', 'حول العالم'],

        /* ---- index work section ---- */
        ['RECENT WORK', 'TRAVAUX RÉCENTS', 'أعمالنا الأخيرة'],
        ['Selected Projects', 'Projets sélectionnés', 'مشاريع مختارة'],
        ['View All', 'Voir tout', 'عرض الكل'],
        ['View All Work', 'Voir tous les projets', 'عرض كل الأعمال'],

        /* ---- project cards (full strings) ---- */
        ['WYRM — Personal Brand & Studio Identity', 'WYRM — Marque personnelle & identité de studio', 'WYRM — علامة شخصية وهوية استوديو'],
        ['Brand Identity + Motion + Web', 'Identité de marque + Motion + Web', 'هوية علامة + موشن + ويب'],
        ['Minato Sushi — Premium Restaurant Experience', 'Minato Sushi — Expérience de restaurant premium', 'Minato Sushi — تجربة مطعم فاخر'],
        ['Restaurant Branding + Visual Identity', 'Branding de restaurant + Identité visuelle', 'براندينغ مطعم + هوية بصرية'],
        ['Djappaman — Music Artist Visual Identity', 'Djappaman — Identité visuelle d’artiste musical', 'Djappaman — هوية بصرية لفنان موسيقي'],
        ['Artist Branding + Visual Identity', 'Branding d’artiste + Identité visuelle', 'براندينغ فنان + هوية بصرية'],
        ['WDRINK — Energy Drink Brand Identity & Motion', 'WDRINK — Identité & motion de boisson énergisante', 'WDRINK — هوية وموشن لعلامة مشروب طاقة'],
        ['Beverage Branding + Mascot + Motion + Web', 'Branding de boisson + Mascotte + Motion + Web', 'براندينغ مشروب + ماسكوت + موشن + ويب'],
        ['THE GATE CONSULTING — Travel Brand Identity', 'THE GATE CONSULTING — Identité de marque de voyage', 'THE GATE CONSULTING — هوية علامة سفر'],
        ['Travel Branding + Guidelines + Stationery', 'Branding voyage + Guidelines + Papeterie', 'براندينغ سفر + دليل + قرطاسية'],
        ['BeFirst — Brand Identity & Guidelines', 'BeFirst — Identité de marque & guidelines', 'BeFirst — هوية العلامة ودليلها'],
        ['Brand Identity + Guidelines + Design System', 'Identité de marque + Guidelines + Design system', 'هوية علامة + دليل + نظام تصميم'],

        /* ---- index services ---- */
        ['WHAT WE DO', 'NOTRE EXPERTISE', 'ما نقوم به'],
        ['Creative solutions for brand challenges.', 'Des solutions créatives aux défis de marque.', 'حلول إبداعية لتحديات العلامات.'],
        ['Logos, visual systems, and brand guidelines that position you as the obvious choice in your market.',
         'Logos, systèmes visuels et guidelines qui font de vous le choix évident de votre marché.',
         'شعارات وأنظمة بصرية وأدلة علامة تجعلها الخيار الواضح في سوقك.'],
        ['Cinematic brand films, video editing, and animations that make your story impossible to scroll past.',
         'Films de marque cinématographiques, montage vidéo et animations qui rendent votre histoire impossible à ignorer.',
         'أفلام علامة سينمائية ومونتاج وأنيميشن تجعل قصتك مستحيلة التمرير.'],
        ['Digital experiences engineered to convert visitors into customers and customers into advocates.',
         'Des expériences digitales conçues pour transformer les visiteurs en clients et les clients en ambassadeurs.',
         'تجارب رقمية مصممة لتحويل الزوار إلى عملاء والعملاء إلى سفراء للعلامة.'],

        /* ---- index FAQ ---- */
        ['Got any questions?', 'Des questions ?', 'لديك أسئلة؟'],
        ['I\'ve got answers.', 'J’ai les réponses.', 'لديّ الإجابات.'],
        ['Why is a brand identity worth more than just a logo?', 'Pourquoi une identité de marque vaut-elle plus qu’un simple logo ?', 'لماذا تساوي هوية العلامة أكثر من مجرد شعار؟'],
        ['A logo is a symbol. A brand identity is a system — typography, color, motion, voice, and strategy working together. Companies with cohesive identities charge 20-30% more than competitors with fragmented visuals. It\'s not decoration. It\'s infrastructure.',
         'Un logo est un symbole. Une identité de marque est un système — typographie, couleur, mouvement, voix et stratégie travaillant ensemble. Les entreprises aux identités cohérentes facturent 20 à 30 % de plus que leurs concurrents aux visuels fragmentés. Ce n’est pas de la décoration. C’est de l’infrastructure.',
         'الشعار رمز. هوية العلامة نظام — تايبوغرافي، لون، حركة، صوت، واستراتيجية تعمل معًا. الشركات ذات الهويات المتكاملة تتقاضى 20-30% أكثر من منافسيها ذوي الهويات المبعثرة. هذا ليس زينة، هذا بنية تحتية.'],
        ['Why not just hire a big agency?', 'Pourquoi ne pas engager une grande agence ?', 'لماذا لا تتعامل مع وكالة كبيرة؟'],
        ['Agencies bill for overhead — account managers, office space, junior staff learning on your budget. You work directly with the creative director. Every dollar goes into the work, not the bureaucracy. Same quality, fraction of the cost.',
         'Les agences facturent leurs frais généraux — chefs de projet, bureaux, juniors qui apprennent sur votre budget. Vous travaillez directement avec le directeur de création. Chaque euro va dans le travail, pas dans la bureaucratie. Même qualité, une fraction du coût.',
         'الوكالات تفرض تكاليفها التشغيلية — مديرو حسابات، مكاتب، وموظفون جدد يتعلمون على حسابك. أنت تعمل مباشرة مع المدير الإبداعي. كل دولار يذهب إلى العمل لا إلى البيروقراطية. نفس الجودة بجزء بسيط من التكلفة.'],
        ['Can\'t I just use templates and AI tools?', 'Puis-je simplement utiliser des templates et l’IA ?', 'ألا يمكنني استخدام القوالب وأدوات الذكاء الاصطناعي؟'],
        ['You can — and so can every competitor in your industry. Templates make you look like everyone else. AI generates what already exists. Custom brand work is the only way to own a position in your market that no one else can replicate.',
         'Vous pouvez — et vos concurrents aussi. Les templates vous font ressembler à tout le monde. L’IA génère ce qui existe déjà. Le sur-mesure est le seul moyen de posséder un positionnement que personne ne peut copier.',
         'بالتأكيد تستطيع — ومثلها كل منافسيك. القوالب تجعلك تشبه الجميع، والذكاء الاصطناعي يولّد ما هو موجود أصلًا. العمل المخصص هو الطريق الوحيد لامتلاك موقع في سوقك لا يستطيع أحد تقليده.'],
        ['Why is your process different from other designers?', 'Pourquoi votre processus est-il différent des autres designers ?', 'لماذا تختلف طريقتك عن المصممين الآخرين؟'],
        ['I don\'t start with aesthetics. I start with your business problem — who you\'re selling to, why they should care, what\'s blocking the sale. Strategy comes first. Then design executes that strategy. The result is work that doesn\'t just look good — it performs.',
         'Je ne commence jamais par l’esthétique. Je commence par votre problème business — à qui vous vendez, pourquoi ils devraient s’y intéresser, ce qui bloque la vente. La stratégie d’abord. Le design exécute ensuite cette stratégie. Résultat : un travail qui n’est pas seulement beau — il performe.',
         'لا أبدأ بالجماليات، بل بمشكلتك التجارية — لمن تبيع، لماذا يجب أن يهتموا، وما الذي يعيق البيع. الاستراتيجية أولًا، ثم ينفّذ التصميم تلك الاستراتيجية. النتيجة عمل لا يبدو جيدًا فحسب، بل يحقق أداءً.'],
        ['How does good design actually increase revenue?', 'Comment le design augmente-t-il réellement les revenus ?', 'كيف يزيد التصميم الجيد الإيرادات فعلاً؟'],
        ['Strong design reduces friction at every stage of the buyer journey. It builds trust in seconds, justifies premium pricing, and turns first-time visitors into repeat customers. Companies investing in strategic design see 2-3x higher conversion rates on key pages.',
         'Un design fort réduit la friction à chaque étape du parcours d’achat. Il installe la confiance en quelques secondes, justifie un prix premium et transforme les visiteurs de passage en clients fidèles. Les entreprises qui investissent dans un design stratégique voient des taux de conversion 2 à 3 fois supérieurs sur leurs pages clés.',
         'التصميم القوي يقلّل الاحتكاك في كل مرحلة من رحلة الشراء. يبني الثقة في ثوانٍ، ويرفع السعر المبرر، ويحوّل الزائر العابر إلى عميل دائم. الشركات التي تستثمر في التصميم الاستراتيجي تحقق معدلات تحويل أعلى بـ2-3 مرات في صفحاتها الرئيسية.'],
        ['How do you position a brand as premium through design?', 'Comment positionner une marque comme premium par le design ?', 'كيف تجعل التصميم علامتك تبدو فاخرة؟'],
        ['Premium is a perception built through restraint. Intentional typography, controlled color palettes, generous white space, and considered motion — every detail signals quality before a word is read. We don\'t shout. We resonate.',
         'Le premium est une perception construite par la retenue. Typographie intentionnelle, palette maîtrisée, blancs généreux, motion considérée — chaque détail signale la qualité avant même la première ligne lue. Nous ne crions pas. Nous résonnons.',
         'الفخامة إدراك يُبنى بضبط النفس. تايبوغرافي مقصود، ألوان محسوبة، مساحات بيضاء سخية، وحركة مدروسة — كل تفصيل يوحي بالجودة قبل قراءة كلمة واحدة. نحن لا نصرخ، بل نتوافق.'],

        /* ---- work page ---- */
        ['Portfolio', 'Portfolio', 'معرض الأعمال'],
        ['Personal brand and creative studio identity system', 'Système d’identité pour marque personnelle et studio créatif', 'نظام هوية لعلامة شخصية واستوديو إبداعي'],
        ['Brand Identity • Motion Design • Web Design', 'Identité de marque • Motion design • Web design', 'هوية علامة • موشن ديزاين • تصميم ويب'],
        ['Premium sushi restaurant brand experience', 'Expérience de marque pour restaurant de sushi premium', 'تجربة علامة لمطعم سوشي فاخر'],
        ['Restaurant Branding • Hospitality • Visual Identity', 'Branding de restaurant • Hôtellerie • Identité visuelle', 'براندينغ مطاعم • ضيافة • هوية بصرية'],
        ['Visual identity and branding for music artist', 'Identité visuelle et branding pour artiste musical', 'هوية بصرية وبراندينغ لفنان موسيقي'],
        ['Artist Branding • Music Industry • Visual Identity', 'Branding d’artiste • Industrie musicale • Identité visuelle', 'براندينغ فنان • صناعة الموسيقى • هوية بصرية'],
        ['Vibrant energy drink brand — identity, mascot, packaging & motion', 'Marque de boisson énergisante vibrante — identité, mascotte, packaging & motion', 'علامة مشروب طاقة نابضة — هوية، ماسكوت، تغليف وموشن'],
        ['Beverage Branding • Mascot • Packaging • Motion', 'Branding de boisson • Mascotte • Packaging • Motion', 'براندينغ مشروبات • ماسكوت • تغليف • موشن'],
        ['Tunisian travel consultancy for immersive Asian journeys — Torii-gate identity & guidelines', 'Consultance de voyage tunisienne pour des voyages immersifs en Asie — identité torii & guidelines', 'مكتب استشارات سفر تونسي لرحلات آسيوية غامرة — هوية بوابة التوري ودليل العلامة'],
        ['Travel Branding • Logo System • Guidelines • Stationery', 'Branding voyage • Système de logo • Guidelines • Papeterie', 'براندينغ سفر • نظام شعار • دليل العلامة • قرطاسية'],
        ['A complete identity system built on the power of B/W', 'Un système d’identité complet bâti sur la puissance du N/B', 'نظام هوية متكامل مبني على قوة الأبيض والأسود'],
        ['Brand Identity • Guidelines • Design System', 'Identité de marque • Guidelines • Design system', 'هوية علامة • دليل • نظام تصميم'],
        ['Start your project →', 'Démarrer votre projet →', 'ابدأ مشروعك ←'],

        /* ---- about page ---- */
        ['A Personal Introduction', 'Une présentation personnelle', 'تقديم شخصي'],
        ['Omar • Founder & Creative Director • Voice Note', 'Omar • Fondateur & directeur de création • Note vocale', 'عمر • المؤسس والمدير الإبداعي • رسالة صوتية'],
        ['Press play to hear from the founder', 'Appuyez sur lecture pour entendre le fondateur', 'اضغط تشغيل لتسمع من المؤسس'],
        ['Creative Studio crafting cinematic brand experiences.', 'Studio créatif qui façonne des expériences de marque cinématographiques.', 'استوديو إبداعي يصنع تجارب علامات سينمائية.'],
        ['We help ambitious businesses turn complex ideas into clear, memorable visual identities and digital experiences.',
         'Nous aidons les entreprises ambitieuses à transformer des idées complexes en identités visuelles claires et mémorables, et en expériences digitales.',
         'نساعد الشركات الطموحة على تحويل الأفكار المعقدة إلى هويات بصرية واضحة لا تُنسى وتجارب رقمية.'],
        ['Read All', 'Tout lire', 'اقرأ الكل'],
        ['The Team', 'L’équipe', 'الفريق'],
        ['Creative Director • Multimedia Designer', 'Directeur de création • Designer multimédia', 'مدير إبداعي • مصمم مالتي ميديا'],
        ['Leads creative direction, brand identity, and cinematic multimedia design across all studio projects.',
         'Dirige la direction créative, l’identité de marque et le design multimédia cinématographique sur tous les projets du studio.',
         'يقود التوجيه الإبداعي وهوية العلامات والتصميم السينمائي في جميع مشاريع الاستوديو.'],
        ['Web Developer', 'Développeur web', 'مطور ويب'],
        ['Engineers responsive, modern web applications and interactive digital experiences with clean, performant code.',
         'Conçoit des applications web modernes et responsives et des expériences interactives avec un code propre et performant.',
         'يبني تطبيقات ويب حديثة متجاوبة وتجارب تفاعلية بكود نظيف وسريع.'],
        ['Business Development Manager', 'Responsable du développement commercial', 'مديرة تطوير الأعمال'],
        ['Drives strategic partnerships, client relationships, and business growth opportunities for WYRM.studios.',
         'Développe les partenariats stratégiques, les relations clients et la croissance commerciale de WYRM.studios.',
         'تقود الشراكات الاستراتيجية وعلاقات العملاء وفرص النمو في WYRM.studios.'],
        ['Marketing Manager', 'Responsable marketing', 'مديرة تسويق'],
        ['Oversees creative brand marketing campaigns, digital storytelling, and audience engagement strategies.',
         'Supervise les campagnes marketing créatives, le storytelling digital et les stratégies d’engagement d’audience.',
         'تشرف على حملات التسويق الإبداعي والسرد الرقمي واستراتيجيات تفاعل الجمهور.'],
        ['Graphic Designer', 'Graphiste', 'مصممة جرافيك'],
        ['Crafts impactful visual assets, brand identity collateral, and modern design systems across digital and print media.',
         'Crée des visuels percutants, des supports d’identité de marque et des systèmes de design modernes pour le digital et l’imprimé.',
         'تصمم أصولًا بصرية مؤثرة وهويات علامات وأنظمة تصميم حديثة رقميًا ومطبوعًا.'],
        ['What This Means for You', 'Ce que cela signifie pour vous', 'ماذا يعني هذا لك'],
        ['When you work with WYRM.studios, you get direct collaboration with our dedicated team of creative and technical specialists. Your project is crafted with high artistic standards, managed with care, and delivered with the precision of a studio that treats every brand like its own.',
         'Chez WYRM.studios, vous collaborez directement avec notre équipe dédiée de spécialistes créatifs et techniques. Votre projet est réalisé avec des standards artistiques élevés, géré avec soin et livré avec la précision d’un studio qui traite chaque marque comme la sienne.',
         'عند العمل مع WYRM.studios تتعاون مباشرة مع فريقنا المتخصص الكامل. يُنفَّذ مشروعك بمعايير فنية عالية، ويُدار بعناية، ويُسلَّم بدقة استوديو يتعامل مع كل علامة كأنها علامته.'],
        ['Who We Are', 'Qui sommes-nous', 'من نحن'],
        ['Problems We Solve', 'Les problèmes que nous résolvons', 'المشكلات التي نحلها'],
        ['A brand that looks generic or forgettable in a crowded market', 'Une marque générique ou oubliable dans un marché saturé', 'علامة تبدو عامة أو قابلة للنسيان في سوق مزدحم'],
        ['Marketing visuals that lack emotional impact and fail to convert', 'Des visuels marketing sans impact émotionnel qui ne convertissent pas', 'مواد تسويق بلا تأثير عاطفي لا تحقق تحويلًا'],
        ['A complex product or service that is difficult to explain simply', 'Un produit ou service complexe, difficile à expliquer simplement', 'منتج أو خدمة معقدة يصعب شرحها ببساطة'],
        ['A digital presence that doesn\'t reflect the quality of the business', 'Une présence digitale qui ne reflète pas la qualité de l’entreprise', 'حضور رقمي لا يعكس جودة العمل'],
        ['Our work focuses on turning complexity into cinematic clarity and strategic design.', 'Notre travail transforme la complexité en clarté cinématographique et en design stratégique.', 'عملنا يحوّل التعقيد إلى وضوح سينمائي وتصميم استراتيجي.'],
        ['The Journey', 'Le parcours', 'الرحلة'],
        ['Visual Storytelling', 'Narration visuelle', 'السرد البصري'],
        ['Started creating visual narratives and discovering the power of motion design.', 'Début avec la création de récits visuels et la découverte du motion design.', 'البداية بصناعة روايات بصرية واكتشاف قوة الموشن ديزاين.'],
        ['Freelance Creative', 'Créatif freelance', 'إبداع مستقل'],
        ['Transitioned into full-time freelance brand identity and motion work.', 'Passage au freelance à temps plein : identité de marque et motion.', 'الانتقال إلى العمل الحر بدوام كامل في هويات العلامات والموشن.'],
        ['Studio Expansion', 'Expansion du studio', 'توسع الاستوديو'],
        ['Expanded capabilities to include full web design and development.', 'Extension des compétences au web design et au développement complet.', 'توسيع القدرات لتشمل تصميم وتطوير الويب بالكامل.'],
        ['Today', 'Aujourd’hui', 'اليوم'],
        ['Operating as a full-service creative studio crafting brand identities, motion, and web experiences.', 'Un studio créatif complet : identités de marque, motion et expériences web.', 'استوديو متكامل يصنع هويات العلامات والموشن وتجارب الويب.'],
        ['What We Do', 'Ce que nous faisons', 'ما نفعله'],
        ['Complete visual identity systems that define how your brand is perceived and remembered.', 'Des systèmes d’identité complets qui définissent la perception et la mémoire de votre marque.', 'أنظمة هوية بصرية كاملة تحدد كيف تُدرَك علامتك وتُذكَر.'],
        ['Cinematic brand films and animations that bring your story to life and drive engagement.', 'Des films de marque cinématographiques qui donnent vie à votre histoire et créent de l’engagement.', 'أفلام علامة سينمائية وأنيميشن تمنح قصتك الحياة وتحقق تفاعلًا.'],
        ['Digital experiences and websites built to convert visitors into loyal customers.', 'Des sites et expériences digitales conçus pour transformer les visiteurs en clients fidèles.', 'تجارب ومواقع رقمية مبنية لتحويل الزوار إلى عملاء أوفياء.'],
        ['Our Approach', 'Notre approche', 'منهجنا'],
        ['Clarity first', 'La clarté d’abord', 'الوضوح أولًا'],
        ['If the audience doesn\'t understand the message, the design has failed.', 'Si le public ne comprend pas le message, le design a échoué.', 'إذا لم يفهم الجمهور الرسالة فقد فشل التصميم.'],
        ['Emotion matters', 'L’émotion compte', 'العاطفة مهمة'],
        ['People remember how a brand made them feel long after they forget the visuals.', 'On se souvient de ce qu’une marque nous a fait ressentir bien après avoir oublié ses visuels.', 'يتذكر الناس شعورهم تجاه العلامة بعد فترة طويلة من نسيان صورها.'],
        ['Strategy over trends', 'La stratégie avant les modes', 'الاستراتيجية قبل الصيحات'],
        ['Great design is built on business strategy, not just following the latest aesthetic trend.', 'Le grand design repose sur la stratégie, pas sur la dernière tendance esthétique.', 'التصميم العظيم مبني على استراتيجية العمل لا على آخر صيحة جمالية.'],
        ['Quality over volume', 'La qualité avant la quantité', 'الجودة قبل الكم'],
        ['Fewer projects, deeper attention, stronger results for every client we work with.', 'Moins de projets, plus d’attention, des résultats plus forts pour chaque client.', 'مشاريع أقل واهتمام أعمق ونتائج أقوى لكل عميل.'],
        ['WYRM • Voice Note', 'WYRM • Note vocale', 'WYRM • رسالة صوتية'],

        /* ---- blog ---- */
        ['The WYRM Journal', 'Le Journal WYRM', 'مجلة WYRM'],
        ['Ideas that make brands impossible to forget', 'Des idées qui rendent les marques impossibles à oublier', 'أفكار تجعل العلامات مستحيلة النسيان'],
        ['Essays on brand identity, motion design and digital strategy — written by the studio, between projects.',
         'Essais sur l’identité de marque, le motion design et la stratégie digitale — écrits par le studio, entre deux projets.',
         'مقالات في هوية العلامات والموشن ديزاين والاستراتيجية الرقمية — يكتبها الاستوديو بين المشاريع.'],
        ['Featured', 'À la une', 'مميز'],
        ['March 2026 · 4 min read', 'Mars 2026 · 4 min de lecture', 'مارس 2026 · 4 دقائق قراءة'],
        ['March 2026 · 5 min read', 'Mars 2026 · 5 min de lecture', 'مارس 2026 · 5 دقائق قراءة'],
        ['March 2026 · 6 min read', 'Mars 2026 · 6 min de lecture', 'مارس 2026 · 6 دقائق قراءة'],
        ['The $100M Brand Film — Are You Rich Enough to Waste It?', 'Le film de marque à 100 M$ — Êtes-vous assez riche pour le gaspiller ?', 'فيلم العلامة بـ100 مليون دولار — هل أنت غني بما يكفي لإهداره؟'],
        ['Netflix, Nike, Apple, Amazon — over $100M a year goes into films that sell nothing. Here\'s what they\'re actually buying, and why it works.',
         'Netflix, Nike, Apple, Amazon — plus de 100 M$ par an investis dans des films qui ne vendent rien. Voici ce qu’ils achètent vraiment, et pourquoi ça marche.',
         'نتفليكس، نايكي، آبل، أمازون — أكثر من 100 مليون دولار سنويًا تُصرف على أفلام لا تبيع شيئًا. إليك ما يشترونه حقًا، ولماذا ينجح ذلك.'],
        ['Read the essay', 'Lire l’essai', 'اقرأ المقال'],
        ['All articles', 'Tous les articles', 'كل المقالات'],
        ['Strategy', 'Stratégie', 'استراتيجية'],
        ['When to Hire a Creative Studio vs. Freelancer', 'Quand engager un studio créatif plutôt qu’un freelance', 'متى تستأجر استوديوًا إبداعيًا بدل مستقل؟'],
        ['The real question isn\'t about budget. It\'s about what you\'re actually buying.', 'La vraie question n’est pas le budget. C’est ce que vous achetez vraiment.', 'السؤال الحقيقي ليس الميزانية، بل ماذا تشتري فعلاً.'],
        ['Read', 'Lire', 'اقرأ'],
        ['What Makes a Brand Unforgettable?', 'Qu’est-ce qui rend une marque inoubliable ?', 'ما الذي يجعل العلامة لا تُنسى؟'],
        ['The three non-negotiable pillars behind every brand people remember.', 'Les trois piliers non négociables de chaque marque mémorable.', 'الركائز الثلاث غير القابلة للتفاوض خلف كل علامة يبقى الناس يتذكرونها.'],
        ['From Art to Code: The WYRM Creative Journey', 'De l’art au code : le parcours créatif WYRM', 'من الفن إلى الكود: رحلة WYRM الإبداعية'],
        ['From 3D worlds to graphic art to motion design — exploring the creative spectrum.', 'Des mondes 3D à l’art graphique au motion design — exploration du spectre créatif.', 'من عوالم ثلاثية الأبعاد إلى الفن الجرافيكي إلى الموشن ديزاين — استكشاف الطيف الإبداعي.'],
        ['More where that came from', 'Ce n’est que le début', 'المزيد قادم'],
        ['Have a brand worth writing about?', 'Une marque qui mérite qu’on écrive dessus ?', 'لديك علامة تستحق أن تُكتب عنها؟'],
        ['We build identities, films and websites for companies that refuse to blend in. Yours could be the next case study.',
         'Nous créons des identités, des films et des sites pour les entreprises qui refusent de passer inaperçues. La vôtre pourrait être la prochaine étude de cas.',
         'نصنع هويات وأفلامًا ومواقع للشركات التي ترفض أن تشبه الجميع. علامتك قد تكون دراسة الحالة التالية.'],

        /* ---- request form ---- */
        ['Request', 'Demande de projet', 'طلب مشروع'],
        ['Tell us where you\'re going. We\'ll build the brand that gets you there.', 'Dites-nous où vous allez. Nous créerons la marque qui vous y mènera.', 'أخبرنا إلى أين أنت ذاهب. سنصنع العلامة التي توصلك إلى هناك.'],
        ['A few quick questions — answer what matters, skip the rest. Under two minutes. A real reply within 24 hours — from a person, not a bot.',
         'Quelques questions rapides — répondez à l’essentiel, sautez le reste. Moins de deux minutes. Une vraie réponse sous 24 h — par une personne, pas un robot.',
         'أسئلة سريعة قليلة — أجب عن المهم وتخطَّ الباقي. أقل من دقيقتين. رد حقيقي خلال 24 ساعة — من شخص، لا روبوت.'],
        ['Reply in 24 hours', 'Réponse sous 24 h', 'رد خلال 24 ساعة'],
        ['Every request, answered.', 'Chaque demande reçoit une réponse.', 'كل طلب يحصل على رد.'],
        ['No spam, ever', 'Zéro spam, jamais', 'لا رسائل مزعجة أبدًا'],
        ['Your details stay between us.', 'Vos informations restent entre nous.', 'بياناتك تبقى بيننا.'],
        ['Clear next steps', 'Prochaines étapes claires', 'خطوات تالية واضحة'],
        ['Scope, timeline, quote — up front.', 'Périmètre, calendrier, devis — tout de suite.', 'النطاق والجدول والعرض — من البداية.'],
        ['STEP 1 OF 7', 'ÉTAPE 1 SUR 7', 'الخطوة 1 من 7'],
        ['STEP 2 OF 7', 'ÉTAPE 2 SUR 7', 'الخطوة 2 من 7'],
        ['STEP 3 OF 7', 'ÉTAPE 3 SUR 7', 'الخطوة 3 من 7'],
        ['STEP 4 OF 7', 'ÉTAPE 4 SUR 7', 'الخطوة 4 من 7'],
        ['STEP 5 OF 7', 'ÉTAPE 5 SUR 7', 'الخطوة 5 من 7'],
        ['STEP 6 OF 7', 'ÉTAPE 6 SUR 7', 'الخطوة 6 من 7'],
        ['STEP 7 OF 7', 'ÉTAPE 7 SUR 7', 'الخطوة 7 من 7'],
        ['PROTOCOL STEP 1/7', 'ÉTAPE 1 SUR 7', 'الخطوة 1 من 7'],
        ['PROTOCOL STEP 2/7', 'ÉTAPE 2 SUR 7', 'الخطوة 2 من 7'],
        ['PROTOCOL STEP 3/7', 'ÉTAPE 3 SUR 7', 'الخطوة 3 من 7'],
        ['PROTOCOL STEP 4/7', 'ÉTAPE 4 SUR 7', 'الخطوة 4 من 7'],
        ['PROTOCOL STEP 5/7', 'ÉTAPE 5 SUR 7', 'الخطوة 5 من 7'],
        ['PROTOCOL STEP 6/7', 'ÉTAPE 6 SUR 7', 'الخطوة 6 من 7'],
        ['PROTOCOL STEP 7/7', 'ÉTAPE 7 SUR 7', 'الخطوة 7 من 7'],
        ['Brand Name / Organization', 'Nom de marque / Organisation', 'اسم العلامة / المؤسسة'],
        ['Continue', 'Continuer', 'متابعة'],
        ['Industry', 'Secteur', 'المجال'],
        ['Tech / Fintech', 'Tech / Fintech', 'تقنية / فينتك'],
        ['Crypto / Web3', 'Crypto / Web3', 'كريبتو / ويب3'],
        ['Marketing / Creative Agency', 'Agence marketing / créative', 'تسويق / وكالة إبداعية'],
        ['Clothing / E-commerce', 'Vêtements / E-commerce', 'ملابس / تجارة إلكترونية'],
        ['Event / Festival', 'Événement / Festival', 'فعاليات / مهرجان'],
        ['Other', 'Autre', 'أخرى'],
        ['Services Needed', 'Services souhaités', 'الخدمات المطلوبة'],
        ['Select all that apply', 'Sélectionnez tout ce qui s’applique', 'اختر كل ما ينطبق'],
        ['Your Information', 'Vos informations', 'معلوماتك'],
        ['First Name', 'Prénom', 'الاسم'],
        ['Last Name', 'Nom', 'اللقب'],
        ['Email', 'E-mail', 'البريد الإلكتروني'],
        ['Phone Number', 'Téléphone', 'رقم الهاتف'],
        ['How did you hear about us?', 'Comment nous avez-vous connus ?', 'كيف عرفت عنا؟'],
        ['Blog / Article', 'Blog / Article', 'مدونة / مقال'],
        ['Referral', 'Recommandation', 'توصية'],
        ['Estimated Budget', 'Budget estimé', 'الميزانية التقديرية'],
        ['Tell us about your project', 'Parlez-nous de votre projet', 'أخبرنا عن مشروعك'],
        ['Optional but helpful', 'Facultatif mais utile', 'اختياري لكنه مفيد'],
        ['Submit Project', 'Envoyer le projet', 'أرسل المشروع'],
        ['Thank you!', 'Merci !', 'شكرًا لك!'],
        ['Your request was sent — the team already sees it in the studio dashboard.', 'Votre demande a été envoyée — l\'équipe la voit déjà dans le tableau de bord du studio.', 'تم إرسال طلبك — يراه الفريق بالفعل في لوحة تحكم الاستوديو.'],
        ['We\'ll get back to you within 24 hours.', 'Nous revenons vers vous sous 24 h.', 'سنعود إليك خلال 24 ساعة.'],
        ['WYRM FORM ENGINE', 'MOTEUR DE FORMULAIRE WYRM', 'محرك نماذج WYRM'],
        ['"How you ask is everything"', '« La manière de demander est tout »', '«طريقة السؤال هي كل شيء»'],
        ['Want to see case studies?', 'Envie de voir les études de cas ?', 'تريد رؤية دراسات الحالة؟'],
        ['See Work', 'Voir les projets', 'شاهد الأعمال'],
        ['Sending...', 'Envoi...', 'جارٍ الإرسال...'],
        ['Submit Protocol →', 'Envoyer le protocole →', 'أرسل البروتوكول ←'],

        /* ---- placeholders / attributes ---- */
        ['Type your answer here...', 'Tapez votre réponse ici...', 'اكتب إجابتك هنا...'],
        ['Describe your project, goals, and timeline...', 'Décrivez votre projet, vos objectifs et votre calendrier...', 'صف مشروعك وأهدافك وجدولك الزمني...']
    ];

    var MAP = {};
    M.forEach(function (row) {
        var k = norm(row[0]);
        if (!MAP[k]) MAP[k] = { fr: row[1], ar: row[2] };
    });

    /* document titles per page */
    var TITLES = [
        [/index\.html$/i, { fr: 'WYRM.studios — Studio créatif', ar: 'WYRM.studios — استوديو إبداعي' }],
        [/work\.html$/i, { fr: 'Projets — WYRM.studios', ar: 'أعمالنا — WYRM.studios' }],
        [/about\.html$/i, { fr: 'À propos — WYRM.studios', ar: 'من نحن — WYRM.studios' }],
        [/blog\.html$/i, { fr: 'Blog — WYRM.studios', ar: 'المدونة — WYRM.studios' }],
        [/inquiry\.html$/i, { fr: 'Démarrer un projet — WYRM.studios', ar: 'ابدأ مشروعك — WYRM.studios' }]
    ];

    /* ------------------------------------------------------------------ *
       State
     * ------------------------------------------------------------------ */
    var currentLang = 'en';
    var ORIG_TEXT = new WeakMap();   // text node -> original nodeValue
    var ORIG_ATTR = new WeakMap();   // element -> { attr: originalValue }
    var wordSplitEls = [];           // [element, originalFullText]

    /* ------------------------------------------------------------------ *
       Boot — apply saved language attributes before first paint
     * ------------------------------------------------------------------ */
    function getSavedLang() {
        try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch (e) { return 'en'; }
    }
    function setHtmlAttrs(lang) {
        var html = document.documentElement;
        html.setAttribute('lang', lang);
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        html.classList.toggle('lang-ar', lang === 'ar');
    }

    /* ------------------------------------------------------------------ *
       Translation core
     * ------------------------------------------------------------------ */
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };

    function applyTextNodes(root, lang) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                var p = node.parentElement;
                if (!p || SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(function (node) {
            var original = ORIG_TEXT.has(node) ? ORIG_TEXT.get(node) : node.nodeValue;
            if (!ORIG_TEXT.has(node)) ORIG_TEXT.set(node, original);
            var key = norm(original);
            var entry = MAP[key];
            if (entry && entry[lang]) {
                node.nodeValue = entry[lang];
            } else {
                node.nodeValue = original;
            }
        });
    }

    function applyPlaceholders(lang) {
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(function (el) {
            var saved = ORIG_ATTR.get(el);
            if (!saved) {
                saved = { placeholder: el.getAttribute('placeholder') };
                ORIG_ATTR.set(el, saved);
            }
            var entry = MAP[norm(saved.placeholder)];
            el.setAttribute('placeholder', (entry && entry[lang]) ? entry[lang] : saved.placeholder);
        });
    }

    /* Word-by-word hero reveals: the animation engine wraps every word in
       spans, so per-text-node matching can't hit it after init. We captured
       the original before the engine ran — re-translate the whole block and
       rebuild the same span structure, revealed instantly. */
    function rebuildWordSplit(el, text) {
        var words = text.trim().split(/\s+/);
        el.innerHTML = words.map(function (w) {
            return '<span style="display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.25em">' +
                   '<span style="display:inline-block;opacity:1;transform:translateY(0)">' + w + '</span></span>&nbsp;';
        }).join('');
    }

    function applyWordSplits(lang) {
        wordSplitEls.forEach(function (pair) {
            var el = pair.el, original = pair.text;
            if (lang === 'en') {
                /* only rebuild if we previously translated it — never on the
                   initial EN load, so the intro animation still plays */
                if (el.dataset.i18nSplit !== undefined) {
                    rebuildWordSplit(el, original);
                    delete el.dataset.i18nSplit;
                }
                return;
            }
            /* translate line by line (the <br> in the source becomes \n in
               textContent), then hand the whole thing to the rebuilder */
            var translated = original.split('\n').map(function (line) {
                var entry = MAP[norm(line)];
                return (entry && entry[lang]) ? entry[lang] : line;
            }).join(' ');
            rebuildWordSplit(el, translated);
            el.dataset.i18nSplit = '1';
        });
    }

    function applyTitle(lang) {
        var path = location.pathname;
        for (var i = 0; i < TITLES.length; i++) {
            if (TITLES[i][0].test(path)) {
                var t = TITLES[i][1][lang];
                if (t) document.title = t;
                break;
            }
        }
    }

    function applyAll(lang) {
        applyTextNodes(document.body, lang);
        applyPlaceholders(lang);
        applyWordSplits(lang);
        applyTitle(lang);
        currentLang = lang;
        updateButtons();
    }

    /* ------------------------------------------------------------------ *
       Globe button — desktop header + mobile menu overlay
     * ------------------------------------------------------------------ */
    var GLOBE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>' +
        '<path d="M2 12h20"/></svg>';

    function makeLangButton(id, extraClass) {
        var btn = document.createElement('button');
        btn.id = id;
        btn.className = extraClass || '';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Change language — Anglais / Français / العربية');
        btn.title = 'English / Français / العربية';
        btn.innerHTML = GLOBE_SVG +
            '<span class="lang-code" style="font-size:11px;font-weight:700;line-height:1;letter-spacing:0.02em">' +
            CODES[currentLang] + '</span>';
        btn.style.cssText = 'display:inline-flex;align-items:center;gap:5px;cursor:pointer;';
        return btn;
    }

    function updateButtons() {
        document.querySelectorAll('.lang-code').forEach(function (span) {
            span.textContent = CODES[currentLang];
        });
    }

    function cycleLang() {
        var next = LANGS[(LANGS.indexOf(currentLang) + 1) % LANGS.length];
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        setHtmlAttrs(next);
        applyAll(next);
    }

    function injectButtons() {
        var header = document.querySelector('header');
        if (!document.getElementById('lang-toggle')) {
            var anchor = document.getElementById('theme-toggle');
            if (!anchor && header) {
                /* blog-post headers have no theme toggle — sit before the CTA */
                anchor = header.querySelector('a[href*="inquiry"]');
            }
            if (anchor && anchor.parentElement) {
                var btn = makeLangButton('lang-toggle',
                    'p-1.5 md:p-2 text-foreground hover:bg-secondary rounded-full transition-colors');
                anchor.parentElement.insertBefore(btn, anchor);
            } else if (header) {
                header.appendChild(makeLangButton('lang-toggle', ''));
            }
        }

        /* mobile menu overlay — some pages ship an empty slot in the HTML,
           others get the button created here */
        var menu = document.getElementById('mobile-menu');
        if (menu) {
            var mobileBtn = document.getElementById('mobile-lang-toggle');
            if (mobileBtn && !mobileBtn.innerHTML.trim()) {
                mobileBtn.innerHTML = GLOBE_SVG +
                    '<span class="lang-code" style="font-size:11px;font-weight:700;line-height:1">' +
                    CODES[currentLang] + '</span>';
                mobileBtn.style.cssText += 'display:inline-flex;align-items:center;gap:5px;cursor:pointer;';
            } else if (!mobileBtn) {
                mobileBtn = makeLangButton('mobile-lang-toggle', 'p-2 text-foreground');
                var mobileTheme = document.getElementById('mobile-theme-toggle');
                if (mobileTheme && mobileTheme.parentElement) {
                    mobileTheme.parentElement.insertBefore(mobileBtn, mobileTheme.nextSibling);
                } else {
                    var mcta = menu.querySelector('a[href*="inquiry"]');
                    if (mcta && mcta.parentElement) {
                        mcta.parentElement.insertBefore(mobileBtn, mcta);
                    } else {
                        menu.appendChild(mobileBtn);
                    }
                }
            }
        }

        document.querySelectorAll('#lang-toggle, #mobile-lang-toggle').forEach(function (b) {
            if (b.dataset.i18nBound) return;
            b.dataset.i18nBound = '1';
            b.addEventListener('click', function (e) {
                e.preventDefault();
                cycleLang();
            });
        });
    }

    /* ------------------------------------------------------------------ *
       RTL / Arabic typography — injected once
     * ------------------------------------------------------------------ */
    function injectStyles() {
        if (document.getElementById('wyrm-i18n-styles')) return;
        var style = document.createElement('style');
        style.id = 'wyrm-i18n-styles';
        style.textContent =
            'html[lang="ar"] body{font-family:"SF Pro AR","Segoe UI",Tahoma,"Noto Naskh Arabic","Noto Kufi Arabic",Arial,sans-serif;}' +
            'html[lang="ar"] *{letter-spacing:0 !important;}' +
            '#lang-toggle .lang-code{color:currentColor;}';
        document.head.appendChild(style);
    }

    /* ------------------------------------------------------------------ *
       Init — this script loads before main.js / scroll-animations.js, so
       translations land on the original markup and capture hero text
       before the word-split engine runs.
     * ------------------------------------------------------------------ */
    injectStyles();

    var saved = getSavedLang();
    if (LANGS.indexOf(saved) === -1) saved = 'en';
    setHtmlAttrs(saved);

    /* capture word-split heroes before the animation engine wraps them */
    document.querySelectorAll('[data-scroll-words]').forEach(function (el) {
        wordSplitEls.push({ el: el, text: el.textContent });
    });

    applyAll(saved);
    injectButtons();
})();
