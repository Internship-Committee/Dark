/* ============================================================
   Renders a single Live Project's dedicated page from the
   ?id= query param, using ICData.getLiveProjectById().
   ============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("lp-detail-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id){
    root.innerHTML = emptyState("No project selected. Go back to Live Projects and pick one to view.");
    return;
  }

  root.innerHTML = `<div class="skeleton-card" style="height:220px;margin-bottom:22px;"></div><div class="skeleton-card" style="height:340px;"></div>`;

  let project;
  try{
    project = await ICData.getLiveProjectById(id);
  }catch(err){
    root.innerHTML = emptyState(err.message);
    return;
  }

  if (!project){
    root.innerHTML = emptyState("That Live Project could not be found — it may have closed or been removed.");
    return;
  }

  document.title = `${project.company} — Live Project · IC IIM Rohtak`;

  const deadlineText = project.deadline ? formatDate(project.deadline) : "Rolling";

  root.innerHTML = `
    <div class="lp-header">
      <div>
        <span class="live-flag"><span class="pulse-dot"></span> LIVE PROJECT</span>
        <h1>${escapeHtml(project.company)}</h1>
        ${project.tagline ? `<p class="lp-tagline">${escapeHtml(project.tagline)}</p>` : ""}
      </div>
      <div class="lp-header-cta">
        <a class="btn btn-primary" href="${escapeHtml(project.applyUrl)}" target="_blank" rel="noopener">
          Apply Now ${ICIcons.arrowRight}
        </a>
        <span class="deadline-note">${ICIcons.calendar} Apply by ${escapeHtml(deadlineText)}</span>
      </div>
    </div>

    <div class="lp-body">
      <div class="lp-main">
        ${project.aboutCompany ? section("About the Company", `<p>${escapeHtml(project.aboutCompany)}</p>`) : ""}
        ${project.jobDescription ? section("Job Description", `<p>${escapeHtml(project.jobDescription)}</p>`) : ""}
        ${project.roles.length ? section("Role" + (project.roles.length > 1 ? "s" : ""), project.roles.map(roleBlock).join("")) : ""}
        ${project.selectionCriteria.length ? section("Selection Criteria", bulletList(project.selectionCriteria)) : ""}
        ${project.policyNote ? `
          <div class="policy-note">
            ${ICIcons.alert}
            <div><strong>IC Policy Note:</strong> ${escapeHtml(project.policyNote)}</div>
          </div>` : ""}
      </div>

      <aside class="lp-sidebar">
        <div class="glass-card apply-card">
          <span class="deadline-label">Application Deadline</span>
          <div class="deadline-big">${escapeHtml(deadlineText)}</div>
          <a class="btn btn-primary" href="${escapeHtml(project.applyUrl)}" target="_blank" rel="noopener">
            Apply Now ${ICIcons.arrowRight}
          </a>
        </div>
        <div class="glass-card">
          <div class="info-row">${ICIcons.pin}<div><div class="info-label">Location</div><div class="info-value">${escapeHtml(project.location)}</div></div></div>
          ${project.duration ? `<div class="info-row">${ICIcons.clock}<div><div class="info-label">Project Duration</div><div class="info-value">${escapeHtml(project.duration)}</div></div></div>` : ""}
          <div class="info-row">${ICIcons.building}<div><div class="info-label">Company</div><div class="info-value">${escapeHtml(project.company)}</div></div></div>
        </div>
      </aside>
    </div>
  `;
});

function section(title, inner){
  return `<section class="glass-card lp-section"><h2>${escapeHtml(title)}</h2>${inner}</section>`;
}

function roleBlock(role){
  return `
    <div class="role-block">
      <h3>${escapeHtml(role.title)}</h3>
      ${role.responsibilities.length ? bulletList(role.responsibilities) : ""}
      ${role.takeaway ? `<div class="takeaway">${escapeHtml(role.takeaway)}</div>` : ""}
    </div>
  `;
}

function bulletList(items){
  return `<ul class="bullet-list">${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function emptyState(message){
  return `<div class="state-msg is-error">${escapeHtml(message)}</div>`;
}

function formatDate(d){
  const t = new Date(d);
  if (isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
