const MAX_CHARS = 150;
const BASE_API_URL = 'http://localhost:3000';

const textareaEL = document.querySelector('.form_textarea');
const counterEL = document.querySelector('.counter');
const formEL = document.querySelector('.form');
const feedsEL = document.querySelector('.feedbacks');
const submitEL = document.querySelector('.submit_btn');
const hashtagListEL = document.querySelector('.hashtags');
const colors = ['#564989', '#6D4989', '#3c7789', '#897749', '#4a8b6b', '#495789'];


//function for feedback generator
const renderFeedbackItem = (feedback) => {
    //change badge color with js cause taiwind nth-child wont work with js
    const colorIndex = feedsEL.children.length % colors.length;
    const badgeColor = colors[colorIndex];

    const feedItem = `
    <li class="feedback cursor-pointer group grid grid-cols-[40px_85px_6fr_1fr] items-center py-4 pr-8.5 pl-7.5 border-b-1 border-b-[#e4e7eb] transition-all duration-200
                 text-[#3a3c42] selection:bg-[#0000001A] hover:bg-white">
        <button
            class="upvote group-hover:translate-x-1.25 cursor-pointer h-10 w-10 rounded-md transition-all duration-200 flex flex-col justify-center items-center hover:bg-[#F3F6F8]">
            <i
                id="upvote__icon" class="fa-solid fa-caret-up block text-[#D7DBE2] text-xl group-hover:text-[#784a86] transition-all duration-200"></i>
            <span
                class="upvote__count group-hover:text-[#784a86] text-[#6c6f76] text-[11px] -mt-0.25">${feedback.upvoteCount}</span>
        </button>
        <section
            class="feedback__badge flex justify-center items-center mr-4 ml-5 rounded-md w-12.25 h-12.25 group-hover:translate-x-1.25 transition-all duration-200"
            style="background-color: ${badgeColor}">
            <p class="feedback__letter text-2xl text-white font-bold">${feedback.badgeLetter}</p>
        </section>
        <div class="feedback__content group-hover:translate-x-1.25 transition-all duration-200">
            <p
                class="feedback__company block text-[11px] uppercase font-bold text-[#898D96] -mt-1 tracking-wider transition-all duration-200">
                ${feedback.company}</p>
            <p
                class="feedback__text text-[#141518] text-sm -mt-0.25 line-clamp-2 transition-all duration-200">
                ${feedback.text}</p>
        </div>
        <p
            class="feedback__date group-hover:translate-x-1.25 text-xs text-[#898b92] ml-auto transition-all duration-200">
            ${feedback.daysAgo === 0 ? 'NEW' : `${feedback.daysAgo}d`}</p>
    </li>`;

    feedsEL.insertAdjacentHTML('beforeend', feedItem);
};

//handle input textarea
const inputHandler = () => {
    const charsTyped = textareaEL.value.length;

    const charsLeft = MAX_CHARS - charsTyped;
    //number of chars left
    counterEL.textContent = charsLeft;
};

textareaEL.addEventListener('input', inputHandler);

//form component
const submitHandler = (e) => {
    e.preventDefault();
    const text = textareaEL.value;

    //style for valid invalid
    if (text.includes('#') && text.length >= 5) {
        changeClass(formEL, 'form-valid');
    } else {
        changeClass(formEL, 'form-invalid');
        textareaEL.focus();
        return;
    }


    const hashtag = text.split(' ').find(word => word.includes('#'));
    const company = hashtag.substring(1);
    const badgeLetter = company.substring(0, 1).toUpperCase();
    const upvoteCount = 0;
    const daysAgo = 0;

    //JSON for feed
    const feed = {
        upvoteCount,
        daysAgo,
        company,
        badgeLetter,
        text
    }


    //API request
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${BASE_API_URL}/${endpoint}`, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return response.json();
    }

    //send feedback
    async function sendFeedback(feed) {
        try {
            const data = await apiRequest('feedbacks', 'POST', feed); // POST to JSON Server
            console.log('✅ Feedback submitted:', data);
        } catch (error) {
            console.error('❌ Failed to submit feedback:', error);
        }
    }

    renderFeedbackItem(feed);
    sendFeedback(feed);

    textareaEL.value = '';
    submitEL.blur();
    counterEL.textContent = MAX_CHARS;

};
//add & remove class func
function changeClass(element, className) {
    formEL.classList.add(className);
    setTimeout(() => { element.classList.remove(className); }, 2000);
}

formEL.addEventListener('submit', submitHandler);

//fetch & load API
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function loadFeedbacks() {
    try {
        const feedbacks = await fetchJSON(`${BASE_API_URL}/feedbacks`);
        document.querySelector('.spinner')?.remove();
        feedbacks.forEach(renderFeedbackItem);
    } catch (err) {
        console.log(err);
        feedsEL.textContent = 'Failed to fetch feedback items';
    }
}
loadFeedbacks();

//upvote & toggle comment
const clickHandler = (e) => {
    const clickedEL = e.target;
    const upvoteEL = clickedEL.className.includes('upvote');
    if (upvoteEL) {
        const upvoteBtnEL = clickedEL.closest('.upvote');
        upvoteBtnEL.disabled = true;
        const upvoteCountEL = upvoteBtnEL.querySelector('.upvote__count');
        let upvoteCount = +upvoteBtnEL.textContent;

        upvoteCountEL.textContent = ++upvoteCount;
    } else {
        const clickedItem = clickedEL.closest('.feedback');
        clickedItem.classList.toggle('bg-white');
        const textEL = clickedItem.querySelector('.feedback__text');
        textEL.classList.toggle('line-clamp-2');
    }

}

feedsEL.addEventListener('click', clickHandler);


//hashtag filtering
const hashtagClickHandler = async (e) => {
    const clickedEL = e.target;


    if (clickedEL.className === "hashtags") return;
    const companyNameFromHashtag = clickedEL.textContent.substring(1).trim();

    feedsEL.innerHTML = '';
    await loadFeedbacks();


    feedsEL.childNodes.forEach(childNode => {
        if (childNode.nodeType === 3) return;

        const companyNameFromFeedbaclItem = childNode.
            querySelector('.feedback__company').textContent.toLowerCase().trim();

        if (companyNameFromHashtag.toLowerCase().trim() !== companyNameFromFeedbaclItem) {
            childNode.remove();
        }
    });

};

hashtagListEL.addEventListener('click', hashtagClickHandler);

