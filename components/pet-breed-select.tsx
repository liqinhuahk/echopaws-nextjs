type PetBreedSelectProps = {
  name?: string;
  defaultValue?: string;
};

const breedOptions = [
  { label: "Shiba Inu", value: "Shiba Inu" },
  { label: "Golden Retriever", value: "Golden Retriever" },
  { label: "Ragdoll Cat", value: "Ragdoll" },
  { label: "British Shorthair", value: "British Shorthair" },
  { label: "Mixed Breed", value: "Mixed" },
  { label: "Other", value: "Other" },
];

export function PetBreedSelect({ name = "breed", defaultValue = "Shiba Inu" }: PetBreedSelectProps) {
  return (
    <select className="input-shell" name={name} required defaultValue={defaultValue}>
      {breedOptions.map((breed) => (
        <option key={breed.value} value={breed.value}>
          {breed.label}
        </option>
      ))}
    </select>
  );
}
