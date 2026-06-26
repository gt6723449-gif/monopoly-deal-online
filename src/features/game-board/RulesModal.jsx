import { t } from "../../i18n/translations";

const RULES = {
  en: {
    title: "Monopoly Deal Rules",
    intro: "Be the first player to collect 3 complete property sets in front of you.",
    sections: [
      {
        title: "Deck",
        items: [
          "The full deck has 110 cards: 106 playable cards plus 4 rule cards.",
          "Playable cards are Money, Property, Property Wild, Rent, and Action cards.",
          "Money cards: 1x $10M, 2x $5M, 3x $4M, 3x $3M, 5x $2M, and 6x $1M.",
          "Action cards: 2 Deal Breaker, 3 Just Say No, 3 Sly Deal, 4 Forced Deal, 3 Debt Collector, 3 It's My Birthday, 10 Pass Go, 3 House, 3 Hotel, and 2 Double Rent.",
          "Rent cards: 2 Brown/Light Blue, 2 Pink/Orange, 2 Red/Yellow, 2 Green/Dark Blue, 2 Railroad/Utility, and 3 multi-color rent cards.",
        ],
      },
      {
        title: "Setup",
        items: [
          "Shuffle the playable cards and deal 5 cards to each player.",
          "Place the remaining cards face down as the draw pile.",
          "Players keep their hand secret. Cards played to the table are visible to everyone.",
        ],
      },
      {
        title: "Turn",
        items: [
          "Draw 2 cards at the start of your turn.",
          "If you start a turn with no cards in hand, draw 5 cards instead.",
          "You may play up to 3 cards during your turn.",
          "You can end your turn early.",
          "At the end of your turn, if you have more than 7 cards in hand, discard down to 7.",
        ],
      },
      {
        title: "Ways to Play Cards",
        items: [
          "Play Money cards to your bank.",
          "Play Action or Rent cards to your bank for their money value instead of using their effect.",
          "Play Property cards and Property Wild cards to your property area.",
          "Play Action and Rent cards to the table to use their effect.",
          "A card placed in the bank stays money and cannot be used later as an action or rent card.",
        ],
      },
      {
        title: "Bank and Payments",
        items: [
          "You can only pay from cards already in your bank or property area.",
          "Cards in your hand cannot be used to pay.",
          "If you cannot pay the full amount, pay as much as you can.",
          "No change is given. If you owe $2M and only have a $3M card, you must pay the full $3M card.",
          "Money paid from a bank goes to the receiver's bank. Property paid as debt goes to the receiver's property area.",
        ],
      },
      {
        title: "Properties and Sets",
        items: [
          "Each color needs a specific number of cards to become a complete set.",
          "Brown, Dark Blue, and Utility need 2 cards. Most other colors need 3 cards. Railroad needs 4 cards.",
          "Property Wild cards can be used as one of their available colors.",
          "A multi-color wild can be used as any property color.",
          "You may change the chosen color of your own wild property cards during your turn.",
        ],
      },
      {
        title: "Rent",
        items: [
          "To charge rent, play a Rent card that matches a property color you own.",
          "Choose the color and the player who must pay.",
          "Multi-color Rent can be used with any property color you own.",
          "The rent amount depends on how many cards you have in that color set.",
          "Double Rent may be played with a Rent card to double the rent.",
        ],
      },
      {
        title: "Houses and Hotels",
        items: [
          "A House can be added only to a complete eligible property set.",
          "A Hotel can be added only to a complete eligible set that already has a House.",
          "Houses add $3M rent. Hotels add $4M rent.",
          "Houses and Hotels cannot be added to Railroad or Utility sets.",
          "If a set is stolen, the House and Hotel on that set move with it.",
        ],
      },
      {
        title: "Action Cards",
        items: [
          "Pass Go: draw 2 extra cards.",
          "Debt Collector: choose one player. That player pays you $5M.",
          "It's My Birthday: every other player pays you $2M.",
          "Sly Deal: steal one property from another player, but not from a complete set.",
          "Forced Deal: swap one of your properties with one property from another player. Complete sets cannot be taken.",
          "Deal Breaker: steal one complete property set from another player.",
          "Just Say No: cancel an action card played against you.",
        ],
      },
      {
        title: "Just Say No",
        items: [
          "Use Just Say No when an action affects you.",
          "It can stop payment actions like Rent, Debt Collector, and Birthday for the responding player.",
          "It can stop stealing or swapping actions like Sly Deal, Forced Deal, and Deal Breaker.",
          "If more than one player is affected, only the player responding with Just Say No is protected from their own payment.",
        ],
      },
      {
        title: "Winning",
        items: [
          "The first player with 3 complete property sets wins immediately.",
          "Wild cards count toward a set only as their currently selected color.",
        ],
      },
    ],
  },
  ar: {
    title: "قواعد مونوبولي ديل",
    intro: "الهدف هو أن تكون أول لاعب يجمع 3 مجموعات عقارات كاملة أمامه.",
    sections: [
      {
        title: "مجموعة البطاقات",
        items: [
          "المجموعة الكاملة فيها 110 بطاقات: 106 بطاقات لعب و4 بطاقات قواعد.",
          "بطاقات اللعب هي: المال، العقارات، العقارات المتعددة، الإيجار، وبطاقات الحركة.",
          "بطاقات المال: بطاقة واحدة $10M، بطاقتان $5M، 3 بطاقات $4M، 3 بطاقات $3M، 5 بطاقات $2M، و6 بطاقات $1M.",
          "بطاقات الحركة: 2 ديل بريكر، 3 فقط قل لا، 3 سلاي ديل، 4 فورسد ديل، 3 جامع الديون، 3 عيد ميلادي، 10 اعبر البداية، 3 منزل، 3 فندق، و2 إيجار مضاعف.",
          "بطاقات الإيجار: 2 بني/أزرق فاتح، 2 زهري/برتقالي، 2 أحمر/أصفر، 2 أخضر/أزرق غامق، 2 سكة/خدمات، و3 إيجار كل الألوان.",
        ],
      },
      {
        title: "بداية اللعبة",
        items: [
          "اخلط بطاقات اللعب ووزع 5 بطاقات لكل لاعب.",
          "ضع باقي البطاقات مقلوبة لتكون كومة السحب.",
          "بطاقات اليد تكون سرية. البطاقات الموجودة على الطاولة ظاهرة للجميع.",
        ],
      },
      {
        title: "الدور",
        items: [
          "اسحب بطاقتين في بداية دورك.",
          "إذا بدأت دورك ولا يوجد في يدك أي بطاقة، اسحب 5 بطاقات بدلا من ذلك.",
          "يمكنك لعب حتى 3 بطاقات في دورك.",
          "يمكنك إنهاء الدور قبل لعب 3 بطاقات.",
          "في نهاية الدور، إذا كان في يدك أكثر من 7 بطاقات، تخلص من الزائد حتى تصبح 7.",
        ],
      },
      {
        title: "طرق لعب البطاقات",
        items: [
          "العب بطاقات المال في البنك الخاص بك.",
          "يمكن لعب بطاقات الحركة أو الإيجار في البنك بقيمتها المالية بدلا من استخدام تأثيرها.",
          "العب بطاقات العقار والعقار المتعدد في منطقة العقارات.",
          "العب بطاقات الحركة والإيجار على الطاولة لاستخدام تأثيرها.",
          "أي بطاقة توضع في البنك تبقى مالا ولا يمكن استخدامها لاحقا كحركة أو إيجار.",
        ],
      },
      {
        title: "البنك والدفع",
        items: [
          "يمكنك الدفع فقط من البطاقات الموجودة في البنك أو منطقة العقارات.",
          "لا يمكن الدفع من بطاقات اليد.",
          "إذا لم تستطع دفع المبلغ كاملا، ادفع كل ما تملكه.",
          "لا يوجد إرجاع فرق. إذا كان عليك $2M ولديك فقط بطاقة $3M، يجب دفع بطاقة $3M كاملة.",
          "المال المدفوع من البنك ينتقل إلى بنك اللاعب المستلم. العقار المدفوع كدين ينتقل إلى منطقة عقارات اللاعب المستلم.",
        ],
      },
      {
        title: "العقارات والمجموعات",
        items: [
          "كل لون يحتاج عددا معينا من البطاقات ليصبح مجموعة كاملة.",
          "البني والأزرق الغامق والخدمات تحتاج بطاقتين. أغلب الألوان الأخرى تحتاج 3 بطاقات. السكة تحتاج 4 بطاقات.",
          "بطاقة العقار المتعدد تستخدم كلون واحد من الألوان المتاحة عليها.",
          "بطاقة العقار متعددة الألوان يمكن استخدامها كأي لون عقار.",
          "يمكنك تغيير لون بطاقات العقار المتعدد الخاصة بك أثناء دورك.",
        ],
      },
      {
        title: "الإيجار",
        items: [
          "لطلب الإيجار، العب بطاقة إيجار تطابق لون عقار تملكه.",
          "اختر اللون واللاعب الذي سيدفع.",
          "إيجار كل الألوان يمكن استخدامه مع أي لون عقار تملكه.",
          "قيمة الإيجار تعتمد على عدد البطاقات التي تملكها في ذلك اللون.",
          "يمكن لعب إيجار مضاعف مع بطاقة إيجار لمضاعفة قيمة الإيجار.",
        ],
      },
      {
        title: "المنازل والفنادق",
        items: [
          "يمكن إضافة منزل فقط إلى مجموعة عقارات كاملة ومسموح لها بالمنازل.",
          "يمكن إضافة فندق فقط إلى مجموعة كاملة فيها منزل مسبقا.",
          "المنزل يزيد الإيجار $3M. الفندق يزيد الإيجار $4M.",
          "لا يمكن إضافة المنازل أو الفنادق إلى مجموعات السكة أو الخدمات.",
          "إذا تمت سرقة مجموعة، ينتقل معها المنزل والفندق الموجودان عليها.",
        ],
      },
      {
        title: "بطاقات الحركة",
        items: [
          "اعبر البداية: اسحب بطاقتين إضافيتين.",
          "جامع الديون: اختر لاعبا واحدا ليدفع لك $5M.",
          "عيد ميلادي: كل اللاعبين الآخرين يدفعون لك $2M.",
          "سلاي ديل: اسرق عقارا واحدا من لاعب آخر، بشرط ألا يكون ضمن مجموعة كاملة.",
          "فورسد ديل: بدل عقارا من عقاراتك مع عقار من لاعب آخر. لا يمكن أخذ عقار من مجموعة كاملة.",
          "ديل بريكر: اسرق مجموعة عقارات كاملة من لاعب آخر.",
          "فقط قل لا: تلغي بطاقة حركة تم لعبها ضدك.",
        ],
      },
      {
        title: "فقط قل لا",
        items: [
          "استخدم فقط قل لا عندما تؤثر عليك بطاقة حركة.",
          "يمكنها منع الدفع مثل الإيجار، جامع الديون، وعيد ميلادي للاعب الذي يرد بها.",
          "يمكنها منع السرقة أو التبديل مثل سلاي ديل، فورسد ديل، وديل بريكر.",
          "إذا كان أكثر من لاعب متأثرا، فاللاعب الذي يستخدم فقط قل لا يحمي نفسه فقط من الدفع المطلوب منه.",
        ],
      },
      {
        title: "الفوز",
        items: [
          "أول لاعب يجمع 3 مجموعات عقارات كاملة يفوز مباشرة.",
          "بطاقات العقار المتعدد تحتسب ضمن المجموعة حسب اللون المختار لها حاليا فقط.",
        ],
      },
    ],
  },
};

export function RulesModal({ language, onClose }) {
  const rules = RULES[language] || RULES.en;

  return (
    <div className="rules-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        dir={language === "ar" ? "rtl" : "ltr"}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rules-modal-header">
          <div>
            <h2 id="rules-title">{rules.title}</h2>
            <p>{rules.intro}</p>
          </div>
          <button type="button" onClick={onClose}>
            {t(language, "close")}
          </button>
        </header>

        <div className="rules-content">
          {rules.sections.map((section) => (
            <article className="rules-section" key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
