import { ButtonLink, Card } from "@/components/ui";

interface MenuItem {
  name: string;
  desc: string;
  price: string;
}

// Лёгкая витрина меню для гостей на главной странице.
const MENU: MenuItem[] = [
  { name: "Карпаччо из тунца", desc: "цитрус, каперсы, оливковое масло", price: "1 200 ₽" },
  { name: "Гриль-осьминог", desc: "молодой картофель, лимон", price: "1 600 ₽" },
  { name: "Паста с морепродуктами", desc: "мидии, креветки, томатный соус", price: "1 450 ₽" },
  { name: "Ризотто с белыми грибами", desc: "пармезан, трюфельное масло", price: "1 150 ₽" },
  { name: "Тирамису", desc: "маскарпоне, эспрессо, какао", price: "650 ₽" },
  { name: "Вино Verde Marea", desc: "бокал белого, средиземноморские сорта", price: "850 ₽" },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-2xl pb-12 pt-16 text-center sm:pb-16 sm:pt-20">
        <p className="text-sm uppercase tracking-widest text-gold">Средиземноморский ресторан</p>
        <h1 className="mt-4 text-5xl font-semibold text-forest">Verde Marea</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink/70">
          Свежие морепродукты, сезонные продукты и камерная атмосфера у моря.
          Забронируйте столик заранее.
        </p>
        <div className="mt-8">
          <ButtonLink href="/book" variant="primary">
            Забронировать стол
          </ButtonLink>
        </div>
      </section>

      <section className="pb-16">
        <h2 className="text-center text-2xl font-semibold text-forest">Из меню</h2>
        <p className="mt-1 text-center text-sm text-ink/60">
          Несколько позиций, чтобы познакомиться с кухней
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MENU.map((item) => (
            <li key={item.name}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-forest">{item.name}</h3>
                  <span className="whitespace-nowrap text-sm font-medium text-gold">
                    {item.price}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/60">{item.desc}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
