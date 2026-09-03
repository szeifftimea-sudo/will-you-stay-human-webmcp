export interface LocalizedCategory {
  categoryId: string;
  name: string;
  description: string;
}

export const categoryCatalogHu = [
  {
    categoryId: "relationships-communication",
    name: "Kapcsolatok és kommunikáció",
    description: "Bizalom, konfliktus, közvetlen megszólalás és digitális közvetítés.",
  },
  {
    categoryId: "learning-development",
    name: "Tanulás és fejlődés",
    description: "Gyakorlás, visszajelzés, szerzőség és a saját gondolkodás határai.",
  },
  {
    categoryId: "work-governance",
    name: "Munka és döntéshozatal",
    description: "Munkahelyi döntések, folyamatok, felelősség és méltányosság.",
  },
  {
    categoryId: "information-public-life",
    name: "Információ és közélet",
    description: "Források, bizonytalanság, nyilvános állítások és közös bizalom.",
  },
  {
    categoryId: "creativity-self-expression",
    name: "Alkotás és önkifejezés",
    description: "Saját hang, stílus, társszerzőség és kreatív automatizálás.",
  },
  {
    categoryId: "care-wellbeing",
    name: "Gondoskodás és jóllét",
    description: "Odafigyelés, mindennapi támogatás és emberi jelenlét, magas kockázatú tanácsadás nélkül.",
  },
  {
    categoryId: "privacy-digital-safety",
    name: "Magánszféra és digitális biztonság",
    description: "Adatátadás, hozzájárulás, profilalkotás és online biztonság.",
  },
] satisfies LocalizedCategory[];

export const categoryCatalogHuById = Object.fromEntries(
  categoryCatalogHu.map((category) => [category.categoryId, category]),
) as Record<string, LocalizedCategory>;
