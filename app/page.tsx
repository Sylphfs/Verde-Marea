import { ButtonLink } from "@/components/ui";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-2xl py-16 text-center sm:py-24">
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
  );
}
