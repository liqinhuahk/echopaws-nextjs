import { createServerSupabaseClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { createPetForUser } from "@/lib/pets";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json({ error: "Please configure Supabase environment variables." }, { status: 500 });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Please log in first to create a pet." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Please use multipart/form-data to submit pet info and image." }, { status: 400 });
  }

  const formData = await request.formData();

  try {
    const result = await createPetForUser(user.id, formData);
    return Response.json({
      success: true,
      pet: result.pet,
      redirectTo: `/chat?pet_created=1&pet_name=${encodeURIComponent(result.pet.name)}&pet_id=${result.pet.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create pet, please try again.";
    return Response.json({ error: message }, { status: 400 });
  }
}
