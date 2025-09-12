// ====== LOGIN POPUP ======
const wrapper = document.querySelector(".wrapper");
const btnPopup = document.querySelector(".btnlogin-popup");
const iconClose = document.querySelector(".icon-close");

btnPopup?.addEventListener("click", () => {
  wrapper.classList.add("active-popup");
});

iconClose?.addEventListener("click", () => {
  wrapper.classList.remove("active-popup");
});

// ====== CREDENCIALES FIJAS ======
const USER_EMAIL = "epalominomeza12345@gmail.com";
const USER_PASS = "admin";

// ====== LOGIN ======
document.querySelector(".form-box.login form").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = e.target.querySelector("input[type=email]").value;
  const password = e.target.querySelector("input[type=password]").value;

  if (email === USER_EMAIL && password === USER_PASS) {
    Swal.fire({
      icon: "success",
      title: "Bienvenido",
      text: "Has iniciado sesión correctamente",
      timer: 2000,
      showConfirmButton: false
    });

    // Ocultar botón Iniciar
    btnPopup.style.display = "none";

    // Mostrar mensaje Bienvenido Eduardo
    const nav = document.querySelector("header nav");
    if (!document.querySelector(".welcome-msg")) {
      const welcome = document.createElement("span");
      welcome.classList.add("welcome-msg");
      welcome.innerHTML = `Bienvenido, <b>Eduardo</b>`;

      const logoutBtn = document.createElement("button");
      logoutBtn.textContent = "Cerrar sesión";
      logoutBtn.classList.add("logout-btn"); // ✅ SOLO esta clase
      logoutBtn.onclick = logout;

      nav.appendChild(welcome);
      nav.appendChild(logoutBtn);
    }

    // Mostrar botones de administración en cada tarjeta
    agregarBotonesAdmin();

    // Cerrar popup
    wrapper.classList.remove("active-popup");
  } else {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Correo o contraseña incorrectos"
    });
  }
});

// ====== LOGOUT ======
function logout() {
  Swal.fire({
    icon: "info",
    title: "Sesión cerrada",
    timer: 1500,
    showConfirmButton: false
  });

  btnPopup.style.display = "inline-block"; // Vuelve a aparecer el botón iniciar
  document.querySelector(".welcome-msg")?.remove();
  document.querySelector(".logout-btn")?.remove();

  // Quitar botones de admin de las tarjetas
  document.querySelectorAll(".admin-actions").forEach((el) => el.remove());
}

// ====== FUNCIONES DE ADMIN ======
function agregarBotonesAdmin() {
  document.querySelectorAll(".semana-card").forEach((card) => {
    if (!card.querySelector(".admin-actions")) {
      const adminBox = document.createElement("div");
      adminBox.classList.add("admin-actions");

      // Botón subir
      const subirBtn = document.createElement("button");
      subirBtn.textContent = "Subir";
      subirBtn.classList.add("btn");
      subirBtn.onclick = () => {
        Swal.fire("Subir", "Aquí subirías un archivo para esta semana.", "info");
      };

      // Botón eliminar
      const eliminarBtn = document.createElement("button");
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.classList.add("btn", "btn-danger");
      eliminarBtn.onclick = () => {
        Swal.fire("Eliminar", "Aquí eliminarías este archivo.", "warning");
      };

      adminBox.appendChild(subirBtn);
      adminBox.appendChild(eliminarBtn);

      card.appendChild(adminBox);
    }
  });
}


/* ==== LOGIN VALIDACIÓN ==== */
const loginForm = document.getElementById("loginForm");
const btnLoginPopup = document.querySelector(".btnlogin-popup");
const cerrarSesionBtn = document.getElementById("cerrarSesion");
const accionesSesion = document.getElementById("accionesSesion");

let sesionIniciada = false;

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email === "epalominomeza12345@gmail.com" && password === "admin") {
    sesionIniciada = true;
    document.querySelector(".nav-links").innerHTML +=
      '<li><span class="bienvenida">Bienvenido, <b>Eduardo</b></span></li>';
    btnLoginPopup.style.display = "none";
    cerrarSesionBtn.style.display = "inline-block";
    accionesSesion.style.display = "block"; // Mostrar subir/eliminar
    document.querySelectorAll(".eliminar").forEach(btn => btn.style.display = "inline-block");
    alert("Inicio de sesión exitoso");
  } else {
    alert("Credenciales incorrectas");
  }
});

/* ==== CERRAR SESIÓN ==== */
cerrarSesionBtn.addEventListener("click", () => {
  sesionIniciada = false;
  location.reload(); // refresca la página y borra bienvenida
});

/* ==== SUBIR ARCHIVOS ==== */
const uploadBtn = document.getElementById("uploadBtn");
const uploadInput = document.getElementById("uploadInput");
const gridTema = document.getElementById("gridTema");

uploadBtn.addEventListener("click", () => {
  uploadInput.click();
});

uploadInput.addEventListener("change", () => {
  const file = uploadInput.files[0];
  if (file && sesionIniciada) {
    const card = document.createElement("div");
    card.classList.add("semana-card");
    card.innerHTML = `
      <h4>${file.name}</h4>
      <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" alt="preview" class="preview-img"/>
      <div class="acciones">
        <a href="#" class="btn">Ver</a>
        <a href="#" download="${file.name}" class="btn">Descargar</a>
        <button class="btn eliminar">Eliminar</button>
      </div>
    `;
    gridTema.appendChild(card);
    uploadInput.value = "";
  }
});

/* ==== ELIMINAR ARCHIVOS ==== */
gridTema.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar") && sesionIniciada) {
    if (confirm("¿Seguro que quieres eliminar este archivo?")) {
      e.target.closest(".semana-card").remove();
    }
  }
});


// ====== FUNCIONES DE ADMIN ACTUALIZADAS ======
function agregarBotonesAdmin() {
  document.querySelectorAll(".semana-card").forEach((card) => {
    if (!card.querySelector(".admin-actions")) {
      const adminBox = document.createElement("div");
      adminBox.classList.add("admin-actions");

      // Crear input file oculto
      const uploadInput = document.createElement("input");
      uploadInput.type = "file";
      uploadInput.style.display = "none";

      // Botón subir
      const subirBtn = document.createElement("button");
      subirBtn.textContent = "Subir";
      subirBtn.classList.add("btn");
      subirBtn.onclick = () => {
        uploadInput.click();
      };

      uploadInput.addEventListener("change", () => {
        const file = uploadInput.files[0];
        if (file) {
          // Crear nueva tarjeta de archivo dentro de la semana
          const newFileCard = document.createElement("div");
          newFileCard.classList.add("semana-card");
          newFileCard.innerHTML = `
            <h4>${file.name}</h4>
            <img src="https://cdn-icons-png.flaticon.com/512/337/337946.png" 
                 alt="preview" class="preview-img"/>
            <div class="acciones">
              <a href="#" class="btn">Ver</a>
              <a href="#" download="${file.name}" class="btn">Descargar</a>
              <button class="btn eliminar">Eliminar</button>
            </div>
          `;
          card.parentNode.appendChild(newFileCard);
        }
      });

      // Botón eliminar
      const eliminarBtn = document.createElement("button");
      eliminarBtn.textContent = "Eliminar";
      eliminarBtn.classList.add("btn", "btn-danger");
      eliminarBtn.onclick = () => {
        Swal.fire({
          title: "¿Eliminar archivo?",
          text: "Esto no se puede deshacer",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            card.remove();
            Swal.fire("Eliminado", "El archivo fue eliminado", "success");
          }
        });
      };

      adminBox.appendChild(subirBtn);
      adminBox.appendChild(eliminarBtn);
      card.appendChild(uploadInput);
      card.appendChild(adminBox);
    }
  });
}

// ====== EVENTO GLOBAL PARA ELIMINAR ======
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar")) {
    e.target.closest(".semana-card").remove();
  }
});