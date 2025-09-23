// app.js - front-end logic for plugin creator, chat mock and coins
// Requires JSZip and FileSaver from CDN (index.html includes them)

(() => {
  /* ---------- Helpers ---------- */
  const get = id => document.getElementById(id);

  /* ---------- Coins UI ---------- */
  const coinsCount = get('coinsCount');
  let coins = 0;
  function setCoins(n){ coins = n; coinsCount.textContent = coins; }
  get('addCoins').addEventListener('click', ()=> setCoins(coins + 5));

  /* ---------- Commands UI ---------- */
  const commandsList = get('commandsList');
  const addCommandBtn = get('addCommand');
  const clearCommands = get('clearCommands');

  function makeCommandRow(name='', desc=''){
    const div = document.createElement('div');
    div.className = 'cmd-row';
    const ni = document.createElement('input'); ni.placeholder='name'; ni.value = name;
    const di = document.createElement('input'); di.placeholder='desc'; di.value = desc;
    const del = document.createElement('button'); del.textContent='✕';
    del.addEventListener('click', ()=> div.remove());
    div.appendChild(ni); div.appendChild(di); div.appendChild(del);
    return div;
  }

  commandsList.appendChild(makeCommandRow('hello','Say hello'));

  addCommandBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    commandsList.appendChild(makeCommandRow());
  });
  clearCommands.addEventListener('click', (e)=>{
    e.preventDefault();
    commandsList.innerHTML = '';
  });

  function gatherPluginInputs(){
    const name = get('pluginName').value.trim() || 'MyPlugin';
    const id = get('pluginId').value.trim() || name.toLowerCase().replace(/\s+/g,'');
    const version = get('pluginVersion').value.trim() || '1.0.0';
    const author = get('pluginAuthor').value.trim() || 'Author';
    const desc = get('pluginDesc').value.trim() || '';
    const basePackage = get('basePackage').value.trim() || 'com.example.myplugin';
    const commands = [];
    commandsList.querySelectorAll('.cmd-row').forEach(r=>{
      const n = r.children[0].value.trim();
      const d = r.children[1].value.trim();
      if(n) commands.push({name:n,desc:d||'No description'});
    });
    return {name,id,version,author,desc,basePackage,commands};
  }

  function genPluginYml(d){
    let y = `name: ${d.name}\nmain: ${d.basePackage}.Main\nversion: ${d.version}\nauthors: [${d.author}]\ndescription: "${d.desc}"\n`;
    if(d.commands && d.commands.length){
      y += 'commands:\n';
      d.commands.forEach(c=>{
        y += `  ${c.name}:\n    description: "${c.desc}"\n`;
      });
    }
    return y;
  }

  function genMainJava(d){
    return `package ${d.basePackage};

import org.bukkit.plugin.java.JavaPlugin;

public class Main extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("${d.name} enabled!");
        // TODO: register commands and listeners
    }

    @Override
    public void onDisable() {
        getLogger().info("${d.name} disabled!");
    }
}
`;
  }

  async function createZipAndDownload(data){
    const zip = new JSZip();
    zip.file('plugin.yml', genPluginYml(data));
    const pkgPath = data.basePackage.replace(/\./g,'/');
    zip.file(`src/main/java/${pkgPath}/Main.java`, genMainJava(data));
    zip.file('README.txt', `Generated plugin skeleton for ${data.name}\nBuild with Maven/Gradle, add Spigot API, compile to JAR.`);
    const blob = await zip.generateAsync({type:'blob'});
    saveAs(blob, `${data.id || data.name}.zip`);
  }

  get('generateBtn').addEventListener('click', async (e)=>{
    e.preventDefault();
    const d = gatherPluginInputs();
    await createZipAndDownload(d);
  });

  // preview plugin.yml
  const previewArea = get('previewArea');
  get('previewBtn').addEventListener('click', (e)=>{
    e.preventDefault();
    const d = gatherPluginInputs();
    if(previewArea.hidden){ previewArea.hidden = false; previewArea.textContent = genPluginYml(d); }
    else { previewArea.hidden = true; }
  });

  /* ---------- Prompt / Chat mock ---------- */
  const chatArea = get('chatArea');
  const promptInput = get('promptInput');
  const quickInput = get('quickInput');

  function appendChat(role, text){
    const el = document.createElement('div');
    el.className = 'chat-msg ' + role;
    el.style.padding = '8px';
    el.style.marginTop = '8px';
    el.style.borderRadius = '8px';
    el.style.background = role === 'user' ? 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)' : 'rgba(255,255,255,0.03)';
    el.innerHTML = `<strong>${role === 'user' ? 'You' : 'Kodari'}</strong><div style="margin-top:6px; white-space:pre-wrap;">${text}</div>`;
    chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  get('sendPrompt').addEventListener('click', (e)=>{
    e.preventDefault();
    const txt = promptInput.value.trim();
    if(!txt) return;
    appendChat('user', txt);
    appendChat('bot', `Mock response for prompt: "${txt}"\n\n(Note: connect a backend to call real AI models.)`);
    promptInput.value = '';
  });

  get('clearPrompt').addEventListener('click', (e)=>{ e.preventDefault(); promptInput.value=''; });

  // quick footer send
  get('quickSend').addEventListener('click', (e)=>{
    e.preventDefault();
    const q = quickInput.value.trim();
    if(!q) return;
    appendChat('user', q);
    appendChat('bot', `Quick mock reply for: "${q}"`);
    quickInput.value = '';
  });

  // model selection change (mock)
  get('modelSelect').addEventListener('change', (e)=>{
    appendChat('bot', `AI model switched to: ${e.target.value}`);
  });

  /* On load */
  setCoins(0);
})();
