let authMode = "login";

function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById("tab-login").classList.toggle("active", mode === "login");
  document.getElementById("tab-signup").classList.toggle("active", mode === "signup");
  document.getElementById("username-group").style.display = mode === "signup" ? "block" : "none";
  document.getElementById("auth-submit-btn").textContent = mode === "login" ? "Enter Studyverse" : "Create Account & Enter";
  document.getElementById("auth-error").textContent = "";
}

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email-input").value.trim();
  const password = document.getElementById("password-input").value;
  const username = document.getElementById("username-input").value.trim() || email.split("@")[0];
  const errorBox = document.getElementById("auth-error");
  errorBox.textContent = "Connecting...";

  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { display_name: username } }
      });
      if (error) throw error;
      currentUser = data.user;
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
    }
    launchWorkspace();
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

// Auto-check existing session on page load
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    currentUser = session.user;
    launchWorkspace();
  }
});

function launchWorkspace() {
  document.getElementById("auth-screen").classList.remove("active");
  document.getElementById("app-screen").classList.add("active");

  const displayName = currentUser.user_metadata?.display_name || currentUser.email.split("@")[0];
  document.getElementById("local-name-tag").textContent = `${displayName} (You)`;

  initWebRTCAndRoom();
  renderTodos();
}