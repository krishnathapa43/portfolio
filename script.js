
    // ===== Matrix rain (visual only) =====
    const canvas = document.getElementById("matrix");
    const ctx = canvas.getContext("2d");

    function sizeCanvas(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    const chars = "01".split("");
    let fontSize = 16;
    let cols = Math.floor(window.innerWidth / fontSize);
    let drops = new Array(cols).fill(1);

    function resetDrops(){
      cols = Math.floor(window.innerWidth / fontSize);
      drops = new Array(cols).fill(1);
    }
    window.addEventListener("resize", resetDrops);

    function draw(){
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      const accent = getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#33ff99";
      ctx.fillStyle = accent;
      ctx.font = fontSize + "px Share Tech Mono";

      for(let i=0;i<drops.length;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        ctx.fillText(text, i*fontSize, drops[i]*fontSize);

        if(drops[i]*fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    draw();

    // ===== Terminal typing =====
    const typing = document.getElementById("typing");
    const typeText = "user: Krishna | role: Frontend | status: building premium interfaces";
    let i = 0;
    function type(){
      if(i <= typeText.length){
        typing.innerHTML = '<span class="cmd">' + typeText.slice(0,i) + '</span><span class="cursor"></span>';
        i++;
        setTimeout(type, 18);
      } else {
        typing.innerHTML = '<span class="cmd">' + typeText + '</span>';
      }
    }
    type();

    // ===== Theme toggle =====
    function toggleTheme(){
      document.body.classList.toggle("purple");
    }
    document.getElementById("themeBtn").addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });
    document.getElementById("themeBtn2").addEventListener("click", (e)=>{ e.preventDefault(); toggleTheme(); });

    // ===== Drawer =====
    const openDrawer = document.getElementById("openDrawer");
    const drawer = document.getElementById("drawer");
    const dOverlay = document.getElementById("drawerOverlay");
    const closeDrawer = document.getElementById("closeDrawer");

    function showDrawer(){
      drawer.classList.add("open");
      dOverlay.classList.add("show");
    }
    function hideDrawer(){
      drawer.classList.remove("open");
      dOverlay.classList.remove("show");
    }
    openDrawer.addEventListener("click", showDrawer);
    closeDrawer.addEventListener("click", hideDrawer);
    dOverlay.addEventListener("click", hideDrawer);
    document.querySelectorAll(".dlink").forEach(a=>a.addEventListener("click", hideDrawer));

    // ===== Uptime =====
    const uptime = document.getElementById("uptime");
    const start = Date.now();
    setInterval(()=>{
      const t = Date.now() - start;
      const s = Math.floor(t/1000);
      const hh = String(Math.floor(s/3600)).padStart(2,'0');
      const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
      const ss = String(s%60).padStart(2,'0');
      uptime.textContent = hh + ":" + mm + ":" + ss;
    }, 1000);

    // ===== Projects modal =====
    const mOverlay = document.getElementById("mOverlay");
    const mTitle = document.getElementById("mTitle");
    const mDesc = document.getElementById("mDesc");
    const closeModal = document.getElementById("closeModal");

    function openModal(title, desc){
      mTitle.textContent = title;
      mDesc.textContent = desc;
      mOverlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
    function hideModal(){
      mOverlay.style.display = "none";
      document.body.style.overflow = "";
    }

    document.querySelectorAll(".pcard").forEach(card=>{
      card.addEventListener("click", ()=>{
        openModal(card.dataset.title, card.dataset.desc);
      });
    });
    closeModal.addEventListener("click", hideModal);
    mOverlay.addEventListener("click", (e)=>{ if(e.target === mOverlay) hideModal(); });
    window.addEventListener("keydown", (e)=>{ if(e.key === "Escape") hideModal(); });

    // ===== Contact demo =====
    document.getElementById("form").addEventListener("submit",(e)=>{
      e.preventDefault();
      const n = document.getElementById("name").value.trim() || "friend";
      alert("Message queued (demo). Thanks, " + n + "!");
      e.target.reset();
    });

    // Year
    document.getElementById("year").textContent = new Date().getFullYear();