'use strict';

function setItemLocalStorage(data, key) {
    localStorage.setItem(`${key}`, JSON.stringify(data));
}

function getItemLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}
const lang = {
    en: {
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        searchPlaceholder: ['Search city'],
        currentWeather: ['Temperature', 'Real Feel'],
        information: {
            title: ['Information'],
            item: ['High / Low', 'Wind', 'Humidity', 'Pressure', 'Visibility', 'Sunrise', 'Sunset'],
            unit: ['', 'm/s', '%', 'hPa', 'm'],
        },
        userCities: ['World forecast', 'Add the cities you interested in'],
        overview: {
            title: ['Overview'],
        },
    },
    uk: {
        days: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
        months: ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'],
        searchPlaceholder: ['Пошук міста'],
        currentWeather: ['Температура', 'Відчувається'],
        information: {
            title: ['Інформація'],
            item: ['Вища / Нижна', 'Вітер', 'Вологість', 'Тиск', 'Видимість', 'Схід сонця', 'Захід сонця'],
            unit: ['', 'м/с', '%', 'гПа', 'м'],
        },
        userCities: ['Світовий прогноз', 'Додайте міста, які вас цікавлять'],
        overview: {
            title: ['Огляд'],
        },
    },
};
const changeLanguageButton = document.querySelector('.change-language__button');
const changeLanguageList = document.querySelector('.change-language__list');
const changeLanguageListButtons = document.querySelectorAll('.change-language__list-button');

changeLanguageButton.addEventListener('click', event => {
    event.stopPropagation();
    changeLanguageList.classList.toggle('change-language__list--active');
});

document.addEventListener('click', () => {
    changeLanguageList.classList.remove('change-language__list--active');
});

changeLanguageListButtons.forEach(item => {
    if (
        !getItemLocalStorage('currentLanguage') &&
        changeLanguageButton.querySelector('.change-language__button-text').textContent === item.textContent
    ) {
        setItemLocalStorage(item.dataset.language, 'currentLanguage');
    }
    if (getItemLocalStorage('currentLanguage') && item.dataset.language === getItemLocalStorage('currentLanguage')) {
        changeLanguageButton.querySelector('.change-language__button-text').textContent = item.textContent;
        changeLanguageButton.dataset.currentLanguage = item.dataset.language;
    }

    item.addEventListener('click', async () => {
        changeLanguageButton.querySelector('.change-language__button-text').textContent = item.textContent;
        if (item.dataset.language === changeLanguageButton.dataset.currentLanguage) return;

        changeLanguageButton.dataset.currentLanguage = item.dataset.language;
        setItemLocalStorage(changeLanguageButton.dataset.currentLanguage, 'currentLanguage');

        changeCurrentDate();
        const { type, cityId, category } = getItemLocalStorage('locationAddress');
        const { cityCoordinates, cityName, provinceName, countryName } = await getCityData(type, cityId, category);
        // console.log(cityName);
        setItemLocalStorage({ type, cityId, category, cityCoordinates, cityName, provinceName, countryName }, 'locationAddress');
        changePageLocationName(cityName, provinceName, countryName);

        const userCitiesList = document.querySelector('.user-cities__list');
        userCitiesList.innerHTML = `
            <li class="user-cities__item user-cities__add-item">
                <button type="button" class="user-cities__icon user-cities__add-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
                        <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                            <path
                                d="M 86.5 41.5 h -38 v -38 C 48.5 1.567 46.933 0 45 0 c -1.933 0 -3.5 1.567 -3.5 3.5 v 38 h -38 C 1.567 41.5 0 43.067 0 45 s 1.567 3.5 3.5 3.5 h 38 v 38 c 0 1.933 1.567 3.5 3.5 3.5 c 1.933 0 3.5 -1.567 3.5 -3.5 v -38 h 38 c 1.933 0 3.5 -1.567 3.5 -3.5 S 88.433 41.5 86.5 41.5 z"
                                fill="black" stroke="black" stroke-width="3" />
                        </g>
                    </svg>
                </button>
                <p class="user-cities__title">World forecast</p>
                <p class="user-cities__description">Add the cities you interested in</p>
            </li>
        `;
        changePageLanguage();

        const userCitiesLocal = getItemLocalStorage('userCities');
        await Promise.all(
            userCitiesLocal.map(async item => {
                const { cityName, provinceName, countryName } = await getCityData(item.type, item.cityId, item.category);
                const currentCityWeather = await getCityDataWeather(item.cityCoordinates, {
                    daily: ['apparent_temperature_max', 'apparent_temperature_min'],
                    temperature_unit: [getItemLocalStorage('tempUnit')],
                    timezone: ['auto'],
                    forecast_days: [1],
                });
                userCitiesList.insertAdjacentHTML(
                    'beforeend',
                    userCitiesCardRender(currentCityWeather, item.cityId, item.type, item.category, cityName, provinceName, countryName),
                );
                // console.log(cityName, provinceName, countryName);
                item.cityName = cityName;
                item.provinceName = provinceName;
                item.countryName = countryName;
            }),
        );
        setItemLocalStorage(userCitiesLocal, 'userCities');

        const userCitiesItems = document.querySelectorAll('.user-cities__button-item');
        userCitiesItems.forEach(userCitiesItem => {
            const cityId = userCitiesItem.dataset.cityId;
            const type = userCitiesItem.dataset.cityType;
            const category = userCitiesItem.dataset.cityCategory;
            const buttonRemove = userCitiesItem.querySelector('.user-cities__item-action-remove');
            const buttonApply = userCitiesItem.querySelector('.user-cities__item-action-apply');

            buttonRemove.addEventListener('click', async () => {
                console.log('remove:', cityId);
            });
            buttonApply.addEventListener('click', async () => {
                if (cityId === getItemLocalStorage('locationAddress').cityId) return;

                const { cityCoordinates, cityName, provinceName, countryName } = await getCityData(type, cityId, category);
                setItemLocalStorage({ type, cityId, category, cityCoordinates, cityName, provinceName, countryName }, 'locationAddress');
                await changeWeatherLocation();
            });
        });
    });
});

function changePageLanguage() {
    const currentLang = getItemLocalStorage('currentLanguage');

    document.querySelector('.search-city-input').placeholder = lang[currentLang].searchPlaceholder[0];
    document.querySelector('.current-weather__temp-text').textContent = lang[currentLang].currentWeather[0];
    document.querySelector('.current-weather__realfeel-temp-text').textContent = lang[currentLang].currentWeather[1];
    document.querySelector('.weather-info__title').textContent = lang[currentLang].information.title[0];
    document.querySelector('.weather-info__sunrise-text').textContent = lang[currentLang].information.item[5];
    document.querySelector('.weather-info__sunset-text').textContent = lang[currentLang].information.item[6];
    document.querySelector('.user-cities__add-item .user-cities__title').textContent = lang[currentLang].userCities[0];
    document.querySelector('.user-cities__add-item .user-cities__description').textContent = lang[currentLang].userCities[1];
    document.querySelectorAll('.weather-info__item').forEach((item, index) => {
        const textItem = item.querySelector('.weather-info__item-text');
        const unitItem = item.querySelector('.weather-info__item-units');
        textItem.textContent = lang[currentLang].information.item[index];
        if (unitItem) unitItem.textContent = lang[currentLang].information.unit[index];
    });
    document.querySelector('.chart__title').textContent = lang[currentLang].overview.title[0];
}
changeCurrentDate();

function changeCurrentDate() {
    const headerCurrentDate = document.querySelector('.header__current-date');
    headerCurrentDate.textContent = getCurrentDate();
}

function getCurrentDate() {
    const currentLang = getItemLocalStorage('currentLanguage');
    const currentDate = new Date();
    const dayName = lang[currentLang].days[currentDate.getDay()];
    const day = currentDate.getDate().toString().padStart(2, '0');
    const monthName = lang[currentLang].months[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
}
const changeTempUnitButton = document.querySelector('.change-temp-unit__button');
const changeTempUnitCelsius = changeTempUnitButton.querySelector('.change-temp-unit__item-celc');
const changeTempUnitFahrenheit = changeTempUnitButton.querySelector('.change-temp-unit__item-far');

if (getItemLocalStorage('tempUnit') && getItemLocalStorage('tempUnit') === 'fahrenheit') {
    changeTempUnitButton.classList.add('change-temp-unit__button--active');
} else {
    changeTempUnitButton.classList.remove('change-temp-unit__button--active');
    setItemLocalStorage('celsius', 'tempUnit');
}

changeTempUnitButton.addEventListener('click', async () => {
    changeTempUnitButton.classList.toggle('change-temp-unit__button--active');
    const currentUnit = changeTempUnitButton.classList.contains('change-temp-unit__button--active') ? 'fahrenheit' : 'celsius';
    changeTempUnitButton.dataset.tempUnit = currentUnit;
    setItemLocalStorage(changeTempUnitButton.dataset.tempUnit, 'tempUnit');

    const { cityCoordinates } = getItemLocalStorage('locationAddress');
    const currentCityWeather = await getCityDataWeather(cityCoordinates);
    // console.log('currentCityWeather:', currentCityWeather);
    renderHourlyCardList(currentCityWeather);
    changePageInformation(currentCityWeather);

    userCitiesRender();
});
changeWeatherLocation();

async function changeWeatherLocation() {
    if (!getItemLocalStorage('locationAddress') && getItemLocalStorage('currentLanguage') === 'en') {
        setItemLocalStorage(
            {
                type: 'R',
                cityId: '172987',
                category: 'boundary',
                cityCoordinates: [-2.99168, 53.4071991],
                cityName: 'Liverpool',
                provinceName: 'England',
                countryName: 'United Kingdom',
            },
            'locationAddress',
        );
    } else if (!getItemLocalStorage('locationAddress') && getItemLocalStorage('currentLanguage') === 'uk') {
        setItemLocalStorage(
            {
                type: 'R',
                cityId: '172987',
                category: 'boundary',
                cityCoordinates: [-2.99168, 53.4071991],
                cityName: 'Ліверпуль',
                provinceName: 'Англія',
                countryName: 'Велика Британія',
            },
            'locationAddress',
        );
    }

    const { cityCoordinates, cityName, provinceName, countryName } = getItemLocalStorage('locationAddress');
    changePageLocationName(cityName, provinceName, countryName);

    const currentCityWeather = await getCityDataWeather(cityCoordinates);
    console.log('currentCityWeather:', currentCityWeather);
    renderHourlyCardList(currentCityWeather);
    itemChangeHeight('current-weather-inner', 'current-weather');
    scrollContent('.current-weather__hours-list', true);
    scrollContent('.user-cities__list');
    changePageInformation(currentCityWeather);
}

function changePageLocationName(cityName, provinceName, countryName) {
    document.querySelector('.current-weather__location-city').textContent = cityName;
    document.querySelector('.current-weather__location-province').textContent = provinceName;
    document.querySelector('.current-weather__location-country').textContent = countryName;
}

function changePageInformation({ current, daily }) {
    document.querySelector('.current-weather__temp-number').textContent = `+${Math.round(current.temperature_2m)}°`;
    document.querySelector('.current-weather__realfeel-temp-number').textContent = `+${Math.round(current.apparent_temperature)}°`;
    document.querySelector('.weather-info__item-value--high-low .weather-info__item-value').textContent = `${Math.round(
        daily.apparent_temperature_max[0],
    )}° / ${Math.round(daily.apparent_temperature_min[0])}°`;
    document.querySelector('.weather-info__item-value--wind .weather-info__item-value').textContent = current.wind_speed_10m;
    document.querySelector('.weather-info__item-value--humidity .weather-info__item-value').textContent = current.relative_humidity_2m;
    document.querySelector('.weather-info__item-value--pressure .weather-info__item-value').textContent = Math.round(current.surface_pressure);
    document.querySelector('.weather-info__item-value--visibility .weather-info__item-value').textContent = current.visibility;
    document.querySelector('.weather-info__sunrise-value').textContent = daily.sunrise[0].slice(-5);
    document.querySelector('.weather-info__sunset-value').textContent = daily.sunset[0].slice(-5);
}

function renderHourlyCardItem({ temperature_2m, time }, index) {
    return `
        <li class="current-weather__hours-item">
            <p class="current-weather__hours-time">${time[index].slice(-5)}</p>
            <div class="current-weather__hours-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.00352 14.1695C4.78883 14.245 4.58533 14.3444 4.39616 14.4643C3.5541 14.1159 2.76537 13.5975 2.0818 12.9093C-0.693935 10.1429 -0.693935 5.64576 2.0818 2.87938C2.36577 2.59565 2.66393 2.34029 2.98339 2.11331C3.51582 1.73737 4.35351 2.36867 4.29672 2.95741C4.10504 4.98608 4.78655 7.09278 6.34835 8.64621C6.94443 9.24452 7.62087 9.71354 8.34325 10.0537C6.44656 10.3669 5 12.0145 5 14C5 14.0568 5.00118 14.1133 5.00352 14.1695Z" fill="white"></path>
                    <path d="M10.5332 5.4617L11.06 7.20828C11.0081 7.24998 10.9569 7.2926 10.9065 7.33612L9.37123 6.29434L7.59443 7.5L8.20922 5.4617L6.49998 4.16944L8.65511 4.10949L9.37123 2.11116L10.0874 4.10949L12.2425 4.16944L10.5332 5.4617Z" fill="white"></path>
                    <path d="M16.6077 4.27602L17.7157 3.44339L16.324 3.41008L15.8578 2.11116L15.3917 3.41008L14 3.44339L15.1079 4.27602L14.7093 5.59493L15.8578 4.81558L17.0063 5.59493L16.6077 4.27602Z" fill="white"></path>
                    <path d="M7 21H20C22.2091 21 24 19.2091 24 17C24 15.1238 22.7083 13.5494 20.9657 13.1174C20.9884 12.9147 21 12.7087 21 12.5C21 9.46243 18.5376 7 15.5 7C12.9806 7 10.8568 8.69403 10.2056 11.0052C10.1375 11.0017 10.0689 11 10 11C7.79086 11 6 12.7909 6 15C6 15.0568 6.00118 15.1133 6.00352 15.1695C4.83649 15.5803 4 16.6925 4 18C4 19.6569 5.34314 21 7 21Z" fill="white"></path>
                </svg>
            </div>
            <p class="current-weather__hours-temp">${Math.round(temperature_2m[index])}°</p>
        </li>
    `;
}

function renderHourlyCardList({ hourly }) {
    const hoursList = document.querySelector('.current-weather__hours-list');
    hoursList.innerHTML = '';
    hourly.temperature_2m.forEach((item, index) => {
        hoursList.insertAdjacentHTML('beforeend', renderHourlyCardItem(hourly, index));
    });
    showItem('current-weather__hours-list', 'current-weather__hours-before');
    hideItem('current-weather__hours-list', 'current-weather__hours-after');
    // console.log('Render finish');
}
const searchCityList = document.querySelector('.search-city__list');
let timeoutId;

const searchCityInput = document.querySelector('.search-city-input');
searchCityInput.addEventListener('input', async () => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
        searchCityList.innerHTML = '';

        if (searchCityInput.value.length < 1) {
            searchCityList.classList.remove('search-city__list--active');
        }
        if (searchCityInput.value.length > 0 && searchCityInput.value.length < 3) {
            searchCityList.classList.add('search-city__list--active');
            searchCityList.innerHTML = `<li class="search-city__no-result">No result</li>`;
        }

        if (searchCityInput.value.length > 2) {
            const citiesList = await getCitiesDataList(searchCityInput.value);
            console.log('citiesList:', citiesList, citiesList.length);

            if (citiesList.length < 1) {
                searchCityList.classList.add('search-city__list--active');
                searchCityList.innerHTML = `<li class="search-city__no-result">No result</li>`;
                return;
            }

            citiesList.forEach(({ osm_id, osm_type, category, display_name }) => {
                searchCityList.insertAdjacentHTML('beforeend', renderCityItem(osm_id, osm_type.slice(0, 1).toUpperCase(), category, display_name));
            });

            if (searchCityList.children.length > 0) searchCityList.classList.add('search-city__list--active');

            const searchCityItems = document.querySelectorAll('.search-city__item');
            searchCityItems.forEach(searchCityItem => {
                searchCityItem.addEventListener('mousedown', event => {
                    event.preventDefault();
                });

                const type = searchCityItem.dataset.cityType;
                const cityId = searchCityItem.dataset.cityId;
                const category = searchCityItem.dataset.cityCategory;
                const searchCityButton = searchCityItem.querySelector('.search-city__button');
                const searchCityButtonAdd = searchCityItem.querySelector('.search-city__button-add');

                searchCityButton.addEventListener('click', async () => {
                    const { cityCoordinates, cityName, provinceName, countryName } = await getCityData(type, cityId, category);
                    setItemLocalStorage({ type, cityId, category, cityCoordinates, cityName, provinceName, countryName }, 'locationAddress');
                    console.log('cityData:', cityCoordinates, cityName, provinceName, countryName);
                    await changeWeatherLocation();
                    searchCityInput.blur();
                });

                searchCityButtonAdd.addEventListener('click', async () => {
                    const { cityCoordinates, cityName, provinceName, countryName } = await getCityData(type, cityId, category);
                    const newCityItem = {
                        type,
                        cityId,
                        category,
                        cityCoordinates,
                        cityName,
                        provinceName,
                        countryName,
                    };
                    const userCitiesLocal = getItemLocalStorage('userCities');

                    for (const item of userCitiesLocal) {
                        if (newCityItem.cityId === item.cityId) {
                            searchCityInput.blur();
                            return;
                        }
                    }

                    userCitiesLocal.unshift(newCityItem);
                    setItemLocalStorage(userCitiesLocal, 'userCities');
                    userCitiesRender();
                    searchCityInput.blur();
                });
            });
        }
    }, 300);
});

async function getCitiesDataList(city) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search.php?q=${city}&accept-language=${getItemLocalStorage('currentLanguage')}&format=jsonv2`,
    );
    const data = await res.json();
    return data;
}

async function getCityData(type, cityId, category) {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/details.php?osmtype=${type}&osmid=${cityId}&class=${category}&addressdetails=1&hierarchy=0&group_hierarchy=1&accept-language=${getItemLocalStorage(
            'currentLanguage',
        )}&format=json`,
    );
    const data = await res.json();
    // console.log(data);

    const cityName = data.localname;
    const provinceName = data.address.filter(item => item.admin_level === 4)[0].localname;
    const countryName = data.address.filter(item => item.type === 'country')[0].localname;
    const cityCoordinates = data.centroid.coordinates;

    return { cityCoordinates, cityName, provinceName, countryName };
}

async function getCityDataWeather(
    [longitude, latitude],
    weatherOptionsData = {
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'weather_code',
            'surface_pressure',
            'wind_speed_10m',
            'visibility',
        ],
        hourly: ['temperature_2m', 'apparent_temperature', 'weather_code'],
        daily: ['sunrise', 'sunset', 'apparent_temperature_max', 'apparent_temperature_min'],
        temperature_unit: [getItemLocalStorage('tempUnit')],
        wind_speed_unit: ['ms'],
        timezone: ['auto'],
        forecast_days: [1],
    },
) {
    const weatherOptions = Object.entries(weatherOptionsData).reduce((accum, [name, values]) => (accum += `&${name}=${values.join(',')}`), '');
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}${weatherOptions}`);
    const data = await res.json();
    // console.log(data);
    return data;
}

function renderCityItem(osmId, type, category, cityName) {
    return `
        <li 
            class="search-city__item"
            data-city-id="${osmId}"
            data-city-type="${type}"
            data-city-category="${category}"
        >
            <button
                type="button"
                class="search-city__button"
                title="Select current"
            >
                ${cityName}
            </button>
            <button
                type="button"
                class="search-city__button-add"
                title="Add to World Forecast"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">
                    <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                        <path d="M 86.5 41.5 h -38 v -38 C 48.5 1.567 46.933 0 45 0 c -1.933 0 -3.5 1.567 -3.5 3.5 v 38 h -38 C 1.567 41.5 0 43.067 0 45 s 1.567 3.5 3.5 3.5 h 38 v 38 c 0 1.933 1.567 3.5 3.5 3.5 c 1.933 0 3.5 -1.567 3.5 -3.5 v -38 h 38 c 1.933 0 3.5 -1.567 3.5 -3.5 S 88.433 41.5 86.5 41.5 z"
                        fill="black"
                        stroke="black"
                        stroke-width="3"></path>
                    </g>
                </svg>
            </button>
        </li>
    `;
}

// async function handleInput() {
//     // Очистити попередній таймаут, якщо він існує
//     clearTimeout(timeoutId);

//     // Встановити новий таймаут
//     timeoutId = setTimeout(async () => {
//         const citiesList = await getCitiesDataList(searchCityInput.value);
//         console.log('citiesList:', citiesList, citiesList.length);
//     }, 500); // Затримка в 500 мс
// }

// function createCustomTimeout(seconds) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve();
//         }, seconds * 1000);
//     });
// }
// const searchCityInput = document.querySelector('.search-city-input');
const clearInputValueButton = document.querySelector('.clear-input-value-button');

clearInputValueButton.addEventListener('mousedown', event => {
    event.preventDefault();
});

clearInputValueButton.addEventListener('click', () => {
    searchCityInput.value = '';
    searchCityList.classList.remove('search-city__list--active');
    clearInputValueButton.classList.remove('clear-input-value-button--active');
    searchCityList.innerHTML = '';
    searchCityInput.focus();
});

searchCityInput.addEventListener('input', () => {
    if (searchCityInput.value === '') {
        clearInputValueButton.classList.remove('clear-input-value-button--active');
    } else {
        clearInputValueButton.classList.add('clear-input-value-button--active');
    }
});

searchCityInput.addEventListener('focus', () => {
    if (searchCityInput.value === '') {
        clearInputValueButton.classList.remove('clear-input-value-button--active');
        searchCityList.classList.remove('search-city__list--active');
    } else {
        clearInputValueButton.classList.add('clear-input-value-button--active');
        searchCityList.classList.add('search-city__list--active');
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            clearInputValueButton.classList.remove('clear-input-value-button--active');
            searchCityList.classList.remove('search-city__list--active');
            searchCityInput.blur();
        }
    });
});

searchCityInput.addEventListener('blur', () => {
    clearInputValueButton.classList.remove('clear-input-value-button--active');
    searchCityList.classList.remove('search-city__list--active');
});
function showItem(scrollContainerClass, itemClass) {
    const scrollContainer = document.querySelector(`.${scrollContainerClass}`);
    const item = document.querySelector(`.${itemClass}`);
    const itemToggleClass = `${itemClass}--active`;

    scrollContainer.addEventListener('scroll', () => {
        if (scrollContainer.scrollLeft > 0) {
            item.classList.add(itemToggleClass);
        } else {
            item.classList.remove(itemToggleClass);
        }
    });
}

function hideItem(scrollContainerClass, itemClass) {
    const scrollContainer = document.querySelector(`.${scrollContainerClass}`);
    const item = document.querySelector(`.${itemClass}`);
    const itemToggleClass = `${itemClass}--active`;

    if (scrollContainer.clientWidth === scrollContainer.scrollWidth) {
        item.classList.add(itemToggleClass);
        return;
    }

    scrollContainer.addEventListener('scroll', () => {
        if (Math.ceil(scrollContainer.scrollLeft) + scrollContainer.clientWidth >= scrollContainer.scrollWidth) {
            item.classList.add(itemToggleClass);
        } else {
            item.classList.remove(itemToggleClass);
        }
    });
}
function itemChangeHeight(currentItemClass, targetItemClass) {
    const targetItem = document.querySelector(`.${targetItemClass}`);
    const currentItem = document.querySelector(`.${currentItemClass}`);
    targetItem.style.height = currentItem.offsetHeight + 'px';
    window.addEventListener('resize', () => {
        targetItem.style.height = currentItem.offsetHeight + 'px';
    });
}
userCitiesRender();

async function userCitiesRender() {
    if (!getItemLocalStorage('userCities')) setItemLocalStorage([], 'userCities');

    const userCitiesList = document.querySelector('.user-cities__list');
    userCitiesList.innerHTML = `
        <li class="user-cities__item user-cities__add-item">
            <button type="button" class="user-cities__icon user-cities__add-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
                    <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                        <path
                            d="M 86.5 41.5 h -38 v -38 C 48.5 1.567 46.933 0 45 0 c -1.933 0 -3.5 1.567 -3.5 3.5 v 38 h -38 C 1.567 41.5 0 43.067 0 45 s 1.567 3.5 3.5 3.5 h 38 v 38 c 0 1.933 1.567 3.5 3.5 3.5 c 1.933 0 3.5 -1.567 3.5 -3.5 v -38 h 38 c 1.933 0 3.5 -1.567 3.5 -3.5 S 88.433 41.5 86.5 41.5 z"
                            fill="black" stroke="black" stroke-width="3" />
                    </g>
                </svg>
            </button>
            <p class="user-cities__title">World forecast</p>
            <p class="user-cities__description">Add the cities you interested in</p>
        </li>
    `;
    changePageLanguage();

    await Promise.all(
        getItemLocalStorage('userCities').map(async ({ cityCoordinates, cityId, type, category, cityName, provinceName, countryName }) => {
            const currentCityWeather = await getCityDataWeather(cityCoordinates, {
                daily: ['apparent_temperature_max', 'apparent_temperature_min'],
                temperature_unit: [getItemLocalStorage('tempUnit')],
                timezone: ['auto'],
                forecast_days: [1],
            });
            // console.log('currentCityWeather:', currentCityWeather);
            userCitiesList.insertAdjacentHTML(
                'beforeend',
                userCitiesCardRender(currentCityWeather, cityId, type, category, cityName, provinceName, countryName),
            );
        }),
    );
    itemChangeHeight('user-cities-inner', 'user-cities');
    showItem('user-cities__list', 'user-cities__before');
    hideItem('user-cities__list', 'user-cities__after');
    hidePagination('.user-cities-inner', '.user-cities__list');

    const userCitiesItems = document.querySelectorAll('.user-cities__button-item');
    userCitiesItems.forEach(userCitiesItem => {
        const cityId = userCitiesItem.dataset.cityId;
        const type = userCitiesItem.dataset.cityType;
        const category = userCitiesItem.dataset.cityCategory;
        const buttonRemove = userCitiesItem.querySelector('.user-cities__item-action-remove');
        const buttonApply = userCitiesItem.querySelector('.user-cities__item-action-apply');

        buttonRemove.addEventListener('click', async () => {
            const userCitiesLocal = getItemLocalStorage('userCities').filter(item => {
                if (cityId === item.cityId) userCitiesItem.remove();
                return cityId !== item.cityId;
            });
            hidePagination('.user-cities-inner', '.user-cities__list');
            setItemLocalStorage(userCitiesLocal, 'userCities');
        });
        buttonApply.addEventListener('click', async () => {
            if (cityId === getItemLocalStorage('locationAddress').cityId) return;
            console.log('click');

            const { cityCoordinates, cityName, provinceName, countryName } = await getCityData(type, cityId, category);
            setItemLocalStorage({ type, cityId, category, cityCoordinates, cityName, provinceName, countryName }, 'locationAddress');
            await changeWeatherLocation();

            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        });
    });
}

function userCitiesCardRender(currentCityWeather, cityId, type, category, cityName, provinceName, countryName) {
    return `
        <li
            class="user-cities__item user-cities__button-item"
            data-city-id="${cityId}"
            data-city-type="${type}"
            data-city-category="${category}"
        >
            <div class="user-cities__item-content">
                <div class="user-cities__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M5.00352 14.1695C4.78883 14.245 4.58533 14.3444 4.39616 14.4643C3.5541 14.1159 2.76537 13.5975 2.0818 12.9093C-0.693935 10.1429 -0.693935 5.64576 2.0818 2.87938C2.36577 2.59565 2.66393 2.34029 2.98339 2.11331C3.51582 1.73737 4.35351 2.36867 4.29672 2.95741C4.10504 4.98608 4.78655 7.09278 6.34835 8.64621C6.94443 9.24452 7.62087 9.71354 8.34325 10.0537C6.44656 10.3669 5 12.0145 5 14C5 14.0568 5.00118 14.1133 5.00352 14.1695Z"
                            fill="black" />
                        <path
                            d="M10.5332 5.4617L11.06 7.20828C11.0081 7.24998 10.9569 7.2926 10.9065 7.33612L9.37123 6.29434L7.59443 7.5L8.20922 5.4617L6.49998 4.16944L8.65511 4.10949L9.37123 2.11116L10.0874 4.10949L12.2425 4.16944L10.5332 5.4617Z"
                            fill="black" />
                        <path
                            d="M16.6077 4.27602L17.7157 3.44339L16.324 3.41008L15.8578 2.11116L15.3917 3.41008L14 3.44339L15.1079 4.27602L14.7093 5.59493L15.8578 4.81558L17.0063 5.59493L16.6077 4.27602Z"
                            fill="black" />
                        <path
                            d="M7 21H20C22.2091 21 24 19.2091 24 17C24 15.1238 22.7083 13.5494 20.9657 13.1174C20.9884 12.9147 21 12.7087 21 12.5C21 9.46243 18.5376 7 15.5 7C12.9806 7 10.8568 8.69403 10.2056 11.0052C10.1375 11.0017 10.0689 11 10 11C7.79086 11 6 12.7909 6 15C6 15.0568 6.00118 15.1133 6.00352 15.1695C4.83649 15.5803 4 16.6925 4 18C4 19.6569 5.34314 21 7 21Z"
                            fill="black" />
                    </svg>
                </div>
                <div class="user-cities__location">
                    <p class="user-cities__city">${cityName}</p>
                    <p class="user-cities__country">${countryName}</p>
                </div>
                <div class="user-cities__temp">
                    <p class="user-cities__temp-high">${Math.round(currentCityWeather.daily.apparent_temperature_max)}°</p>
                    <span class="user-cities__temp-slash">/</span>
                    <p class="user-cities__temp-low">${Math.round(currentCityWeather.daily.apparent_temperature_min)}°</p>
                </div>
            </div>
            <div class="user-cities__item-actions">
                <button type="button" class="user-cities__item-action user-cities__item-action-remove"
                    title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" xmlns:v="https://vecta.io/nano">
                        <path d="M6 12H18" stroke="#000" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>
                <button type="button" class="user-cities__item-action user-cities__item-action-apply"
                    title="Apply">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" xmlns:v="https://vecta.io/nano">
                        <path fill-rule="evenodd"
                            d="M20.61 5.207a1 1 0 0 1 .183 1.402l-10 13a1 1 0 0 1-1.5.097l-5-5a1 1 0 1 1 1.414-1.414l4.195 4.195L19.207 5.39a1 1 0 0 1 1.402-.183z"
                            fill="#000" />
                    </svg>
                </button>
            </div>
        </li>
    `;
}

const userCitiesAddButton = document.querySelector('.user-cities__add-icon');
userCitiesAddButton.addEventListener('click', () => {
    searchCityInput.focus();
});
function scrollContent(scrollContentClass, startScroll = false) {
    const targetContent = document.querySelector(scrollContentClass);
    const scrollInterval = 500;
    let buttonStatus = false;
    let scrollPosition = 0;

    if (startScroll === true && new Date().toLocaleTimeString() >= '02:00')
        targetContent.scrollLeft = (parseInt(new Date().toLocaleTimeString()) - 1) * 70;

    targetContent.parentElement.querySelector('.pagination-button-prev').addEventListener('click', () => {
        if (buttonStatus) return;
        if (targetContent.scrollLeft <= 0) return;

        scrollPosition = targetContent.scrollLeft;
        buttonStatus = true;

        targetContent.scrollBy({
            left: scrollInterval * -1,
            behavior: 'smooth',
        });
    });

    targetContent.parentElement.querySelector('.pagination-button-next').addEventListener('click', () => {
        if (buttonStatus) return;
        if (Math.round(targetContent.scrollLeft) + targetContent.clientWidth >= targetContent.scrollWidth) return;

        scrollPosition = targetContent.scrollLeft;
        buttonStatus = true;

        targetContent.scrollBy({
            left: scrollInterval,
            behavior: 'smooth',
        });
    });

    targetContent.addEventListener('scroll', () => {
        if (
            Math.round(scrollPosition) + scrollInterval === Math.round(targetContent.scrollLeft) ||
            Math.round(targetContent.scrollLeft) + targetContent.clientWidth >= targetContent.scrollWidth
        ) {
            buttonStatus = false;
        }
        if (Math.round(scrollPosition) - scrollInterval === Math.round(targetContent.scrollLeft) || targetContent.scrollLeft <= 0) {
            buttonStatus = false;
        }
    });
}

function hidePagination(parentElementClass, scrollContentElementClass) {
    const parentElement = document.querySelector(parentElementClass);
    const scrollContentElement = document.querySelector(scrollContentElementClass);
    const paginationButtons = parentElement.querySelectorAll('.pagination-button');

    if (scrollContentElement.scrollWidth <= scrollContentElement.offsetWidth) {
        paginationButtons.forEach(button => button.classList.add('pagination-button-hide'));
    } else {
        paginationButtons.forEach(button => button.classList.remove('pagination-button-hide'));
    }
}
const ctx = document.getElementById('weatherChart').getContext('2d');

const mainTextColor = createVarFromCss('--main-text-color');
const secondaryTextColor = createVarFromCss('--secondary-text-color');
const mainBackgroundColor = createVarFromCss('--main-background-color');
const mainBorderRadius = createVarFromCss('--main-border-radius');
const secondaryBorderRadius = (mainBorderRadius.match(/[\d.]+/)[0] * 10) / 1.3;
// console.log(mainTextColor.concat('14'));

const options = {
    borderColor: mainTextColor,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    pointBackgroundColor: mainTextColor,
    pointBorderColor: mainTextColor,
    pointRadius: 4,
    pointHoverRadius: 7,
    fill: true,
    tension: 0.3,
};

const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: {
        humidity: {
            label: 'Humidity',
            data: [50, 45, 55, 60, 50, 65, 70, 75, 80, 75, 70, 65],
            ...options,
        },
        uvIndex: {
            label: 'UV Index',
            data: [3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4],
            ...options,
        },
        rainfall: {
            label: 'Rainfall',
            data: [30, 40, 50, 60, 70, 80, 90, 100, 90, 80, 70, 60],
            ...options,
        },
        pressure: {
            label: 'Pressure',
            data: [1010, 1012, 1015, 1013, 1011, 1010, 1009, 1008, 1007, 1006, 1008, 1010],
            ...options,
        },
    },
};

const config = {
    type: 'line',
    data: {
        labels: data.labels,
        datasets: [data.datasets.humidity],
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        onResize: function (chart, size) {
            if (window.innerWidth <= 768) {
                config.options.maintainAspectRatio = false;
            }
        },
        aspectRatio: 5 / 2,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.raw}${context.dataset.label === 'Pressure' ? ' hPa' : '%'}`;
                    },
                },
                displayColors: false,
                titleColor: mainBackgroundColor,
                bodyColor: mainBackgroundColor,
                backgroundColor: mainTextColor,
                cornerRadius: secondaryBorderRadius,
                padding: 10,
                caretPadding: 15,
                caretSize: 0,
                titleMarginBottom: 3,
                titleFont: {
                    size: 14,
                },
                bodyFont: {
                    size: 12,
                },
            },
            datalabels: {
                align: 'end',
                anchor: 'end',
                color: mainTextColor,
                font: {
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    padding: 20,
                    color: secondaryTextColor,
                },
                grid: {
                    display: false,
                },
            },
            y: {
                ticks: {
                    callback: function (value, index, values) {
                        return value + '%';
                    },
                    padding: 30,
                    color: secondaryTextColor,
                },
                border: {
                    display: false,
                    dash: [10, 10],
                },
                grid: {
                    tickColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.05)',
                    // color: mainBackgroundColor,
                },
            },
        },
    },
    plugins: [ChartDataLabels],
};

const weatherChart = new Chart(ctx, config);

document.querySelectorAll('.chart__tabs-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.chart__tabs-button').forEach(item => item.classList.remove('chart__tabs-button--active'));
        button.classList.add('chart__tabs-button--active');

        const type = button.getAttribute('data-type');
        weatherChart.config.data.datasets = [data.datasets[type]];
        // weatherChart.options.scales.y.max = type === 'pressure' ? 1020 : 100;

        // weatherChart.options.scales.y.max = Math.max(...data.datasets[type].data) + 10;
        // weatherChart.options.scales.y.min = Math.min(...data.datasets[type].data) - 10;
        weatherChart.options.scales.y.ticks.callback = function (value, index, values) {
            return value + (type === 'pressure' ? ' hPa' : '%');
        };

        weatherChart.update();
    });
});

function createVarFromCss(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// stop-transition
window.addEventListener('load', () => {
    document.body.classList.remove('js-stop-transition');
});
// console.log('Stop-transition remove');