import type { ComponentProps } from 'react';

import { LOCALES, MENU_LINKS, NAV_LINKS } from './home.data';

const GLOBE_PATH =
    'M3.05493 11.8633H7.05009C7.2743 9.10009 8.1991 6.4477 9.72571 4.15311C6.16881 5.07925 3.46801 8.12652 3.05493 11.8633ZM12 4.41408C10.3303 6.56522 9.30879 9.15011 9.05759 11.8633H14.9424C14.6912 9.15011 13.6697 6.56522 12 4.41408ZM14.9424 13.8633C14.6912 16.5765 13.6697 19.1613 12 21.3125C10.3303 19.1613 9.30879 16.5765 9.05759 13.8633H14.9424ZM7.05009 13.8633H3.05493C3.46801 17.6 6.16881 20.6473 9.72571 21.5735C8.1991 19.2789 7.2743 16.6265 7.05009 13.8633ZM14.2743 21.5735C15.8009 19.2789 16.7257 16.6265 16.9499 13.8633H20.9451C20.532 17.6 17.8312 20.6473 14.2743 21.5735ZM20.9451 11.8633H16.9499C16.7257 9.10009 15.8009 6.4477 14.2743 4.15311C17.8312 5.07925 20.532 8.12652 20.9451 11.8633ZM1 12.8633C1 6.78815 5.92487 1.86328 12 1.86328C18.0751 1.86328 23 6.78815 23 12.8633C23 18.9384 18.0751 23.8633 12 23.8633C5.92487 23.8633 1 18.9384 1 12.8633Z';

const CLOSE_PATH =
    'M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z';

const CHECK_PATH =
    'M20.7071 5.29289C21.0976 5.68342 21.0976 6.31658 20.7071 6.70711L9.70711 17.7071C9.31658 18.0976 8.68342 18.0976 8.29289 17.7071L3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929C3.68342 10.9024 4.31658 10.9024 4.70711 11.2929L9 15.5858L19.2929 5.29289C19.6834 4.90237 20.3166 4.90237 20.7071 5.29289Z';

function GlobeIcon() {
    return (
        <svg className="svg-2" fill="none" viewBox="0 0 24 25" width="100%" xmlns="http://www.w3.org/2000/svg">
            {' '}
            <path clipRule="evenodd" d={GLOBE_PATH} fill="currentColor" fillRule="evenodd" />{' '}
        </svg>
    );
}

function CloseIcon(props: ComponentProps<'svg'>) {
    return (
        <svg fill="none" viewBox="0 0 24 24" width="100%" xmlns="http://www.w3.org/2000/svg" {...props}>
            {' '}
            <path clipRule="evenodd" d={CLOSE_PATH} fill="currentColor" fillRule="evenodd" />{' '}
        </svg>
    );
}

function LocaleList() {
    return (
        <div className="locals_list flex-v new-button w-locales-items" data-locals-list="" role="list">
            {' '}
            {LOCALES.map((locale) => (
                <div key={locale.code} className="w-locales-item" role="listitem">
                    {' '}
                    <a
                        aria-current="page"
                        className="nav-link new-button_label no-caps"
                        href="#"
                        hrefLang={locale.code}
                    >
                        {` ${locale.name} `}
                    </a>{' '}
                </div>
            ))}{' '}
        </div>
    );
}

function MobileLocaleList() {
    return (
        <div className="full-w w-locales-items" role="list">
            {' '}
            {LOCALES.map((locale) => (
                <div key={locale.code} className="w-locales-item" role="listitem">
                    {' '}
                    <a
                        aria-current="page"
                        className="locale-mobile-link full-w w-inline-block"
                        data-menu-link=""
                        href="#"
                        hrefLang={locale.code}
                    >
                        {' '}
                        <div>{locale.name}</div>{' '}
                        <svg
                            className="icon-large"
                            fill="none"
                            viewBox="0 0 24 24"
                            width="100%"
                            xmlns="http://www.w3.org/2000/svg"
                            data-locale-check=""
                        >
                            {' '}
                            <path clipRule="evenodd" d={CHECK_PATH} fill="currentColor" fillRule="evenodd" />{' '}
                        </svg>{' '}
                    </a>{' '}
                </div>
            ))}{' '}
        </div>
    );
}

export function HomeNav() {
    return (
        <nav className="nav-w" theme="light">
            {' '}
            <div className="nav-inner">
                {' '}
                <a
                    aria-current="page"
                    aria-label="homepage"
                    className="nav-logo w-inline-block w--current"
                    data-nav-logo=""
                    href="#"
                >
                    <span className="tradel-logo tradel-logo--nav" aria-label="Tradel">
                        tradel
                    </span>
                </a>{' '}
                <div className="nav-content">
                    {' '}
                    <div className="nav-list">
                        {' '}
                        {NAV_LINKS.map((label) => (
                            <a key={label} className="nav-link new-button_label" data-nav-item="" href="#">
                                {` ${label} `}
                            </a>
                        ))}{' '}
                    </div>{' '}
                    <div className="nav-buttons">
                        {' '}
                        <a
                            className="new-button w-inline-block"
                            data-nav-item=""
                            data-wf--button--variant="base"
                            href="#"
                            data-external-disabled="true"
                            scramble-link=""
                            target="_blank"
                        >
                            {' '}
                            <div className="new-button_label" scramble-text="">
                                TRADE NOW
                            </div>{' '}
                        </a>{' '}
                        <div className="locals_wrapper w-locales-list" data-locals="">
                            {' '}
                            <div className="new-button locales" data-nav-item="">
                                {' '}
                                <GlobeIcon /> <div className="new-button_label">en</div>{' '}
                            </div>{' '}
                            <LocaleList />{' '}
                        </div>{' '}
                    </div>{' '}
                    <div className="menu-btn">
                        {' '}
                        <div className="menu-btn__line" /> <div className="menu-btn__line" />{' '}
                        <div className="menu-btn__line" />{' '}
                    </div>{' '}
                </div>{' '}
            </div>{' '}
        </nav>
    );
}

export function HomeMenu() {
    return (
        <div className="menu-w">
            {' '}
            <div className="menu-inner">
                {' '}
                <div className="menu-links">
                    {' '}
                    {MENU_LINKS.map((label) => (
                        <a key={label} className="menu-link w-inline-block" data-menu-link="" href="#">
                            {' '}
                            <div className="menu-link__active" />{' '}
                            <div className="menu-link__text">{label}</div>{' '}
                            <div className="menu-link__active is--right" />{' '}
                        </a>
                    ))}{' '}
                </div>{' '}
                <div className="menu-bottom">
                    {' '}
                    <div className="locals_wrapper w-locales-list" data-locale-open="" data-locals="">
                        {' '}
                        <button className="menu-button is--language">
                            {' '}
                            <GlobeIcon /> <div className="new-button_label">English</div>{' '}
                            <svg
                                className="svg-2"
                                fill="none"
                                viewBox="0 0 17 16"
                                width="100%"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {' '}
                                <path
                                    clipRule="evenodd"
                                    d="M5.36177 6.19526C5.10142 6.45561 5.10142 6.87772 5.36177 7.13807L8.02843 9.80474C8.28878 10.0651 8.71089 10.0651 8.97124 9.80474L11.6379 7.13807C11.8983 6.87772 11.8983 6.45561 11.6379 6.19526C11.3776 5.93491 10.9554 5.93491 10.6951 6.19526L8.49984 8.39052L6.30458 6.19526C6.04423 5.93491 5.62212 5.93491 5.36177 6.19526Z"
                                    fill="currentColor"
                                    fillRule="evenodd"
                                />{' '}
                            </svg>{' '}
                        </button>{' '}
                        <LocaleList />{' '}
                    </div>{' '}
                    <a
                        className="menu-button w-inline-block"
                        data-nav-item=""
                        href="#"
                        data-external-disabled="true"
                        target="_blank"
                    >
                        {' '}
                        <div className="new-button_label" scramble-text="">
                            trade now
                        </div>{' '}
                    </a>{' '}
                </div>{' '}
                <div id="language-mobile" className="languages-mobile">
                    {' '}
                    <div className="v-32" />{' '}
                    <div className="w-layout-vflex flex-h space-between">
                        {' '}
                        <CloseIcon className="icon-med sm--invisible" />{' '}
                        <div scramble-text="">Language</div>{' '}
                        <CloseIcon className="icon-large" data-locale-close="" />{' '}
                    </div>{' '}
                    <div className="v-32" />{' '}
                    <div className="locales-wrapper w-locales-list">
                        {' '}
                        <MobileLocaleList />{' '}
                    </div>{' '}
                </div>{' '}
            </div>{' '}
        </div>
    );
}
