const CONFIG_KEY = "leve-cloud-config";
const SESSION_KEY = "leve-cloud-session";
const API_TABLE = "finance_data";
const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
export class CloudStore {
  constructor(onStatus = () => {}) { this.onStatus = onStatus; this.config = read(CONFIG_KEY) || {}; this.session = read(SESSION_KEY); this.timer = null; }
  get configured() { return Boolean(this.config.url && this.config.key); }
  get signedIn() { return Boolean(this.session?.access_token && this.session?.user?.id); }
  get email() { return this.session?.user?.email || ""; }
  setConfig(url, key) {
    const cleanUrl = url.trim().replace(/\/$/, "");
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cleanUrl) || !key.trim()) throw new Error("Confira a URL do projeto e a chave publishable do Supabase.");
    this.config = { url: cleanUrl, key: key.trim() }; localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
  }
  async request(path, { method = "GET", body, auth = true, prefer } = {}) {
    if (auth && this.session?.refresh_token && this.session?.expires_at && this.session.expires_at < Date.now() / 1000 + 60) await this.refreshSession();
    const token = auth && this.session?.access_token ? this.session.access_token : this.config.key;
    const response = await fetch(`${this.config.url}${path}`, { method, headers: { apikey: this.config.key, Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}), ...(prefer ? { Prefer: prefer } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || `Supabase retornou ${response.status}.`);
    return result;
  }
  async authenticate(email, password, create = false) {
    if (!this.configured) throw new Error("Salve primeiro a URL e a chave publishable do projeto Supabase.");
    const result = await this.request(`/auth/v1/${create ? "signup" : "token?grant_type=password"}`, { method: "POST", auth: false, body: { email: email.trim(), password } });
    if (!result.access_token) return { needsEmailVerification: true };
    this.setSession(result); return { needsEmailVerification: false };
  }
  setSession(session) { this.session = { ...session, expires_at: session.expires_at || (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined) }; localStorage.setItem(SESSION_KEY, JSON.stringify(this.session)); }
  async refreshSession() {
    try { const refreshed = await this.request("/auth/v1/token?grant_type=refresh_token", { method: "POST", auth: false, body: { refresh_token: this.session.refresh_token } }); this.setSession(refreshed); }
    catch { this.session = null; localStorage.removeItem(SESSION_KEY); throw new Error("Sua sessão expirou. Entre novamente para sincronizar."); }
  }
  async restore() {
    if (!this.configured || !this.signedIn) return false;
    try { const user = await this.request("/auth/v1/user"); this.session.user = user; localStorage.setItem(SESSION_KEY, JSON.stringify(this.session)); return true; }
    catch { this.session = null; localStorage.removeItem(SESSION_KEY); return false; }
  }
  async loadOrMigrate(localData) {
    const found = await this.request(`/rest/v1/${API_TABLE}?select=data&user_id=eq.${encodeURIComponent(this.session.user.id)}&limit=1`);
    if (found.length) return found[0].data;
    await this.write(localData); return localData;
  }
  async write(data) {
    await this.request(`/rest/v1/${API_TABLE}?on_conflict=user_id`, { method: "POST", body: { user_id: this.session.user.id, data, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
  }
  scheduleSave(data) {
    if (!this.signedIn) return;
    this.lastData = structuredClone(data); clearTimeout(this.timer); this.timer = setTimeout(async () => { try { await this.write(this.lastData); } catch (error) { this.onStatus(`Falha ao sincronizar: ${error.message}`); } }, 450);
  }
  async signOut() {
    clearTimeout(this.timer);
    if (this.signedIn) { if (this.lastData) await this.write(this.lastData).catch(error => this.onStatus(`Falha ao salvar antes de sair: ${error.message}`)); await this.request("/auth/v1/logout", { method: "POST" }).catch(() => {}); }
    this.session = null; this.lastData = null; localStorage.removeItem(SESSION_KEY);
  }
}
