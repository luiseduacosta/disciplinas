const API_URL = '/api';

const state = {
    view: 'categorias', // categorias, tópicos, tópico-detalhes
    categoryId: null,
    topicId: null,
    categoryName: null
};

// DOM Elements
const mainContent = document.getElementById('mainContent');
const pageTitle = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');

// Navigation History
const historyStack = [];

function navigateTo(view, params = {}) {
    historyStack.push({ ...state });
    state.view = view;
    Object.assign(state, params);
    render();
}

function goBack() {
    if (historyStack.length > 0) {
        const prevState = historyStack.pop();
        Object.assign(state, prevState);
        render();
    }
}

backBtn.addEventListener('click', goBack);

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function renderCategorias() {
    pageTitle.textContent = 'Categorias';
    backBtn.style.display = 'none';
    mainContent.innerHTML = '<div class="loading">Carregando categorias...</div>';

    const categorias = await fetchData('/categorias');

    if (!categorias || categorias.length === 0) {
        mainContent.innerHTML = '<div class="empty">Nenhuma categoria encontrada.</div>';
        return;
    }

    mainContent.innerHTML = '';
    categorias.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${cat.nome}</h2>
            <p>${cat.descricao || ''}</p>
        `;
        card.addEventListener('click', () => {
            navigateTo('topicos', { categoryId: cat.id, categoryName: cat.nome });
        });
        mainContent.appendChild(card);
    });
}

async function renderTopicos() {
    pageTitle.textContent = state.categoryName || 'Tópicos';
    backBtn.style.display = 'block';
    mainContent.innerHTML = '<div class="loading">Carregando tópicos...</div>';

    const topicos = await fetchData(`/topicos?categoria_id=${state.categoryId}`);

    if (!topicos || topicos.length === 0) {
        mainContent.innerHTML = '<div class="empty">Nenhum tópico encontrado nesta categoria.</div>';
        return;
    }

    mainContent.innerHTML = '';
    topicos.forEach(topico => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${topico.questao}</h2>
            <p>Toque para ler mais...</p>
        `;
        card.addEventListener('click', () => {
            navigateTo('topico-detalhes', { topicId: topico.id });
        });
        mainContent.appendChild(card);
    });
}

async function renderTopicoDetalhes() {
    pageTitle.textContent = 'Detalhes';
    backBtn.style.display = 'block';
    mainContent.innerHTML = '<div class="loading">Carregando conteúdo...</div>';

    const topico = await fetchData(`/topicos/${state.topicId}`);

    if (!topico) {
        mainContent.innerHTML = '<div class="empty">Erro ao carregar tópico.</div>';
        return;
    }

    const tagsHtml = topico.tags ? topico.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '';

    mainContent.innerHTML = `
        <div class="topic-detail">
            <h2 class="topic-question">${topico.questao}</h2>
            <div class="topic-content">${topico.topico}</div>
            <div class="tags">${tagsHtml}</div>
        </div>
    `;
}

// Render Function
function render() {
    if (state.view === 'categorias') {
        renderCategorias();
    } else if (state.view === 'topicos') {
        renderTopicos();
    } else if (state.view === 'topico-detalhes') {
        renderTopicoDetalhes();
    }
}

// Initial Render
render();
