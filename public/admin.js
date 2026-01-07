const API_URL = '/api';

const state = {
    view: 'categorias', // categories, topics, tags
    categorias: [],
    topicos: [],
    tags: []
};

// DOM Elements
const adminContent = document.getElementById('adminContent');
const navCategorias = document.getElementById('navCategorias');
const navTopicos = document.getElementById('navTopicos');
const navTags = document.getElementById('navTags');

// Modals
const categoriaModal = document.getElementById('categoriaModal');
const topicoModal = document.getElementById('topicoModal');
const tagModal = document.getElementById('tagModal');

// Forms
const categoriaForm = document.getElementById('categoriaForm');
const topicoForm = document.getElementById('topicoForm');
const tagForm = document.getElementById('tagForm');

// Navigation
navCategorias.addEventListener('click', () => setView('categorias'));
navTopicos.addEventListener('click', () => setView('topicos'));
navTags.addEventListener('click', () => setView('tags'));

function setView(view) {
    state.view = view;
    // Update Nav
    [navCategorias, navTopicos, navTags].forEach(btn => btn.classList.remove('active'));
    if (view === 'categorias') navCategorias.classList.add('active');
    if (view === 'topicos') navTopicos.classList.add('active');
    if (view === 'tags') navTags.classList.add('active');

    render();
}

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function sendData(endpoint, method, data) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Request failed');
        return result;
    } catch (error) {
        alert('Erro: ' + error.message);
        return null;
    }
}

// Render Functions
async function render() {
    adminContent.innerHTML = '<div class="loading">Carregando...</div>';

    if (state.view === 'categorias') {
        renderCategorias();
    } else if (state.view === 'topicos') {
        renderTopicos();
    } else if (state.view === 'tags') {
        renderTags();
    }
}

async function renderCategorias() {
    const categorias = await fetchData('/categorias');
    state.categorias = categorias;

    let html = `
        <div class="admin-actions">
            <button class="btn-add" onclick="openCategoriaModal()">+ Nova Categoria</button>
        </div>
        <div class="admin-list">
    `;

    categorias.forEach(cat => {
        html += `
            <div class="admin-item">
                <div class="item-info">
                    <h3>${cat.nome}</h3>
                    <p>${cat.descricao || ''}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="openCategoriaModal(${cat.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteCategoria(${cat.id})">Excluir</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    adminContent.innerHTML = html;
}

async function renderTopicos() {
    // Need categories for context or filter, but for now fetching all topics
    // Also fetching categories to map names if needed, though API might not return cat name, we can join client side or just show ID
    const topicos = await fetchData('/topicos');
    const categorias = await fetchData('/categorias'); // For mapping names
    state.topicos = topicos;
    state.categorias = categorias;

    let html = `
        <div class="admin-actions">
            <button class="btn-add" onclick="openTopicoModal()">+ Novo Tópico</button>
        </div>
        <div class="admin-list">
    `;

    topicos.forEach(topico => {
        const cat = categorias.find(c => c.id === topico.categoria_id);
        const catName = cat ? cat.nome : 'Sem Categoria';
        html += `
            <div class="admin-item">
                <div class="item-info">
                    <h3>${topico.questao}</h3>
                    <p>${catName}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="openTopicoModal(${topico.id})">Editar</button>
                    <button class="btn-delete" onclick="deleteTopico(${topico.id})">Excluir</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    adminContent.innerHTML = html;
}

async function renderTags() {
    const tags = await fetchData('/tags');
    state.tags = tags;

    let html = `
        <div class="admin-actions">
            <button class="btn-add" onclick="openTagModal()">+ Nova Tag</button>
        </div>
        <div class="admin-list">
    `;

    tags.forEach(tag => {
        html += `
            <div class="admin-item">
                <div class="item-info">
                    <h3>${tag.nome}</h3>
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteTag(${tag.id})">Excluir</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    adminContent.innerHTML = html;
}

// Modal & Form Logic -- Categories

window.openCategoriaModal = (id = null) => {
    const title = document.getElementById('catModalTitle');
    const idInput = document.getElementById('catId');
    const nomeInput = document.getElementById('catNome');
    const descricaoInput = document.getElementById('catDescricao');

    if (id) {
        const cat = state.categorias.find(c => c.id === id);
        if (title) title.textContent = 'Editar Categoria';
        idInput.value = cat.id;
        nomeInput.value = cat.nome;
        descricaoInput.value = cat.descricao;
    } else {
        if (title) title.textContent = 'Nova Categoria';
        idInput.value = '';
        nomeInput.value = '';
        descricaoInput.value = '';
    }
    categoriaModal.classList.remove('hidden');
};

categoriaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('catId').value;
    const nome = document.getElementById('catNome').value;
    const descricao = document.getElementById('catDescricao').value;

    const data = { nome, descricao };
    let result;

    if (id) {
        result = await sendData(`/categorias/${id}`, 'PUT', data);
    } else {
        result = await sendData('/categorias', 'POST', data);
    }

    if (result) {
        closeModal('categoriaModal');
        renderCategorias();
    }
});

window.deleteCategoria = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        await sendData(`/categorias/${id}`, 'DELETE');
        renderCategorias();
    }
};

// Modal & Form Logic -- Tags

window.openTagModal = () => {
    // Only Create for now, Edit needs PUT endpoint which we added but for simplicity in UI we can just delete/create or add edit later if needed.
    // Actually we added PUT /api/tags/:id, let's implement just creation first as simpler. 
    // Wait, I see I didn't add UPDATE for tags in backend implementation plan explicitly but I added it in backend code? 
    // Checking backend code... I did NOT add PUT /api/tags/:id in the backend code step provided. I only added GET, POST, DELETE.
    // So Tag Edit is not supported yet on backend.

    const title = document.getElementById('tagModalTitle');
    const idInput = document.getElementById('tagId');
    const nomeInput = document.getElementById('tagNome');

    if (title) title.textContent = 'Nova Tag';
    idInput.value = '';
    nomeInput.value = '';

    tagModal.classList.remove('hidden');
};

if (tagForm) {
    tagForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('tagNome').value;

        const result = await sendData('/tags', 'POST', { nome });

        if (result) {
            closeModal('tagModal');
            renderTags();
        }
    });
}

window.deleteTag = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta tag?')) {
        await sendData(`/tags/${id}`, 'DELETE');
        renderTags();
    }
};

// Modal & Form Logic -- Topics

window.openTopicoModal = async (id = null) => {
    // We need categories and tags to populate form
    const categorias = await fetchData('/categorias');
    const tags = await fetchData('/tags');
    state.categorias = categorias;
    state.tags = tags;

    const title = document.getElementById('topicoModalTitle');
    const idInput = document.getElementById('topicoId');
    const catSelect = document.getElementById('topicoCategoria');
    const questionInput = document.getElementById('topicoQuestao');
    const contentInput = document.getElementById('topicoConteudo');
    const tagsList = document.getElementById('topicoTagsList');

    // Populate Categories
    catSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categorias.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat.id}">${cat.nome}</option>`;
    });

    // Populate Tags
    tagsList.innerHTML = '';
    tags.forEach(tag => {
        tagsList.innerHTML += `
            <label class="tag-checkbox">
                <input type="checkbox" value="${tag.id}" name="topicoTags"> ${tag.nome}
            </label>
        `;
    });

    if (id) {
        // Fetch full detail including current tags
        const topicoData = await fetchData(`/topicos/${id}`);
        // topicData contains .tags array of objects {id, name}

        if (title) title.textContent = 'Editar Tópico';
        idInput.value = topicoData.id;
        catSelect.value = topicoData.categoria_id;
        questionInput.value = topicoData.questao;
        contentInput.value = topicoData.topico;

        // Check tags
        if (topicoData.tags) {
            const checkBoxes = document.getElementsByName('topicoTags');
            const topicoTagIds = topicoData.tags.map(t => t.id);
            checkBoxes.forEach(cb => {
                if (topicoTagIds.includes(parseInt(cb.value))) {
                    cb.checked = true;
                }
            });
        }
    } else {
        if (title) title.textContent = 'Novo Tópico';
        idInput.value = '';
        catSelect.value = '';
        questionInput.value = '';
        contentInput.value = '';
    }

    topicoModal.classList.remove('hidden');
};

topicoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('topicoId').value;
    const categoria_id = document.getElementById('topicoCategoria').value;
    const questao = document.getElementById('topicoQuestao').value;
    const topico = document.getElementById('topicoConteudo').value;

    // Get Selected Tags
    const checkBoxes = document.getElementsByName('topicoTags');
    const selectedTags = [];
    checkBoxes.forEach(cb => {
        if (cb.checked) selectedTags.push(cb.value);
    });

    const data = { categoria_id, questao, topico };
    let result;

    if (id) {
        result = await sendData(`/topicos/${id}`, 'PUT', data);
    } else {
        result = await sendData('/topicos', 'POST', data);
    }

    if (result) {
        const topicoId = id || result.data.id;

        // Handle Tags
        // Simplest way: Delete all tags for topic then re-add selected?
        // Or if new topic, just add.
        // Backend has delete /topics/:id/tags/:tag_id and post /topics/:id/tags
        // Ideally we should sync. 

        // For simplicity: We will just try to add all tags. 
        // If we are editing, we should probably clear first or be smarter.
        // But our backend 'topic_tags' has (topic_id, tag_id) PK so duplicates won't insert (INSERT OR IGNORE was used).

        // However, if we uncheck a tag, we need to delete it.
        // So correct way is: 
        // 1. Get current tags (if edit) - verify what to add and what to remove.
        // OR: Wipe all tags for this topic and re-add.
        // I don't have a "Delete ALL tags for topic" endpoint.

        // Let's iterate:
        // Get current tags from server again?

        const currentData = await fetchData(`/topicos/${topicoId}`);
        const currentTagIds = currentData.tags ? currentData.tags.map(t => t.id) : [];

        const toAdd = selectedTags.filter(tid => !currentTagIds.includes(parseInt(tid)));
        const toRemove = currentTagIds.filter(tid => !selectedTags.includes(tid.toString())); // selectedTags are strings

        // Process Additions
        for (const tagId of toAdd) {
            await sendData(`/topicos/${topicoId}/tags`, 'POST', { tag_id: tagId });
        }

        // Process Removals
        for (const tagId of toRemove) {
            await sendData(`/topicos/${topicoId}/tags/${tagId}`, 'DELETE');
        }

        closeModal('topicoModal');
        renderTopicos();
    }
});

window.deleteTopico = async (id) => {
    if (confirm('Tem certeza que deseja excluir este tópico?')) {
        await sendData(`/topicos/${id}`, 'DELETE');
        renderTopicos();
    }
};


// Utils
window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.add('hidden');
};

// Initial Render
render();
