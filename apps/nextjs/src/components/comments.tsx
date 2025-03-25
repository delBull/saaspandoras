import { cn } from "@saasfly/ui";
import Marquee from "@saasfly/ui/marquee";
import Image from "next/image";

const reviews = [
  {
    "name": "Carlos",
    "username": "@carlos",
    "body": "Nunca había visto algo tan innovador. Pandoras ha cambiado la forma en que invertimos en propiedades, ¡es realmente revolucionario!",
    "img": "https://avatar.vercel.sh/carlos"
  },
  {
    "name": "Sofía",
    "username": "@sofia",
    "body": "La plataforma de Pandoras me ha abierto nuevas oportunidades de inversión en bienes raíces. Es fácil de usar y llena de beneficios únicos.",
    "img": "https://avatar.vercel.sh/sofia"
  },
  {
    "name": "Juan",
    "username": "@juan",
    "body": "Estoy encantado con Pandoras. Es increíble cómo han simplificado la inversión en propiedades con un enfoque tan moderno y accesible.",
    "img": "https://avatar.vercel.sh/juan"
  },
  {
    "name": "Luis",
    "username": "@luis",
    "body": "Pandoras ha transformado mi manera de ver las inversiones en bienes raíces. La transparencia y las oportunidades que ofrecen son impresionantes.",
    "img": "https://avatar.vercel.sh/luis"
  },
  {
    "name": "María",
    "username": "@maria",
    "body": "La facilidad y seguridad que brinda Pandoras para invertir en proyectos inmobiliarios es asombrosa. Definitivamente, una revolución en el sector.",
    "img": "https://avatar.vercel.sh/maria"
  },
  {
    "name": "Fernando",
    "username": "@fernando",
    "body": "Con Pandoras tengo acceso a oportunidades únicas de inversión en el mercado. Es el futuro de las inversiones en bienes raíces.",
    "img": "https://avatar.vercel.sh/fernando"
  },
    {
      "name": "Miguel",
      "username": "@miguel",
      "body": "Pandoras me ha abierto nuevas oportunidades de inversión. La plataforma es sencilla y confiable.",
      "img": "https://avatar.vercel.sh/jack"
    },
    {
      "name": "Patricia",
      "username": "@patricia",
      "body": "La experiencia con Pandoras es única; me siento parte de una comunidad exclusiva y con visión de futuro.",
      "img": "https://avatar.vercel.sh/jill"
    },
    {
      "name": "Ricardo",
      "username": "@ricardo",
      "body": "Gracias a Pandoras, he diversificado mi inversión en bienes raíces de forma innovadora.",
      "img": "https://avatar.vercel.sh/john"
    },
    {
      "name": "Lorena",
      "username": "@lorena",
      "body": "La plataforma me brinda transparencia y seguridad en cada paso, ¡altamente recomendable!",
      "img": "https://avatar.vercel.sh/jane"
    },
    {
      "name": "Sergio",
      "username": "@sergio",
      "body": "Pandoras me permite invertir en proyectos inmobiliarios de alto valor sin complicaciones.",
      "img": "https://avatar.vercel.sh/jenny"
    },
    {
      "name": "Isabel",
      "username": "@isabel",
      "body": "Estoy encantada con Pandoras; es una herramienta que realmente transforma la inversión inmobiliaria.",
      "img": "https://avatar.vercel.sh/james"
    }
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
      <Image 
          src={img}
          alt={`${name}'s avatar`}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
};

const Comments = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg py-4 sm:py-20 md:py-20 xl:py-20">
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
    </div>
  );
};

export { Comments };
