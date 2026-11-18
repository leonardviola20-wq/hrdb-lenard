export function formatDigits(value: string, groups: number[]) {
  const digits = value.replace(/\D/g, "").slice(0, groups.reduce((sum, size) => sum + size, 0));
  let offset = 0;
  return groups.map((size) => {
    const part = digits.slice(offset, offset + size);
    offset += size;
    return part;
  }).filter(Boolean).join("-");
}

export function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)].filter(Boolean).join(" ");
}

export function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age -= 1;
  return Math.max(0, age);
}

export const supportedEmployeePhotoTypes = ["image/jpeg", "image/png", "image/gif"] as const;
export const maxEmployeePhotoSize = 2 * 1024 * 1024;

export function getEmployeePhotoError(file: Pick<File, "type" | "size">) {
  if (!supportedEmployeePhotoTypes.some((type) => type === file.type)) {
    return "Please select a JPG, PNG, or GIF image.";
  }
  if (file.size > maxEmployeePhotoSize) {
    return "Photo must be 2 MB or smaller.";
  }
  return null;
}

export function readPhotoAsDataUrl(file: File): Promise<string> {
  const validationError = getEmployeePhotoError(file);
  if (validationError) return Promise.reject(new Error(validationError));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read the selected photo."));
    };
    reader.onerror = () => reject(new Error("Unable to read the selected photo."));
    reader.readAsDataURL(file);
  });
}

export function readPhoto(file: File, onPhoto: (value: string) => void, onError: (value: string) => void) {
  void readPhotoAsDataUrl(file).then(onPhoto, (error: unknown) => {
    onError(error instanceof Error ? error.message : "Unable to read the selected photo.");
  });
}
