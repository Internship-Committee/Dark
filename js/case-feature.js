document.addEventListener("DOMContentLoaded", async () => {
  const post = document.getElementById("cased-it-post");
  if (!post || !window.ICData?.getCaseFeature) return;

  try{
    const feature = await ICData.getCaseFeature();
    const postUrl = new URL(String(feature?.postLink || "").trim());
    if (postUrl.protocol !== "https:" && postUrl.protocol !== "http:") return;

    post.href = postUrl.href;
    post.target = "_blank";
    post.rel = "noopener noreferrer";
    post.removeAttribute("aria-disabled");
    post.removeAttribute("tabindex");
  }catch(error){
    // Keep the poster present but inert until a valid public post URL is added.
  }
});
