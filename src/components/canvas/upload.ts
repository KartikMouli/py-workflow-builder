const ASSEMBLIES_URL = "https://api2.transloadit.com/assemblies";

type AssemblyStatus = {
  ok?: string;
  error?: string;
  assembly_ssl_url: string;
  results?: Record<string, { ssl_url?: string }[]>;
};

export async function uploadImage(file: File): Promise<string> {
  const signed = await fetch("/api/uploads/sign", { method: "POST" });
  if (!signed.ok) throw new Error("Could not sign upload");
  const { params, signature } = await signed.json();

  const form = new FormData();
  form.append("params", params);
  form.append("signature", signature);
  form.append("file", file);

  let status: AssemblyStatus = await fetch(ASSEMBLIES_URL, { method: "POST", body: form }).then((r) =>
    r.json(),
  );

  while (status.ok !== "ASSEMBLY_COMPLETED") {
    if (status.error || status.ok === "ASSEMBLY_FAILED") throw new Error(status.error ?? "Upload failed");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await fetch(status.assembly_ssl_url).then((r) => r.json());
  }

  const url = status.results?.uploaded?.[0]?.ssl_url ?? Object.values(status.results ?? {})[0]?.[0]?.ssl_url;
  if (!url) throw new Error("Upload returned no file");
  return url;
}
