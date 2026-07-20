import { PRESS_QUOTES, type PressQuote } from './home.data';
import { SliderArrows } from './slider-arrows';

function PressSlide({ item }: { item: PressQuote }) {
    return (
        <div className="swiper-slide press w-dyn-item" role="listitem">
            {' '}
            <a
                className="press-slide w-inline-block"
                href="#"
                data-external-disabled="true"
                target="_blank"
            >
                {' '}
                <div className="flex-h gap--med">
                    {' '}
                    <img
                        alt={item.outlet}
                        className="press-logo"
                        loading="lazy"
                        src={item.logo}
                    />{' '}
                    <div className="h-reg">{item.outlet}</div>{' '}
                </div>{' '}
                <p className="p-large">{item.quote}</p>{' '}
                <div className="press-slide__cta">
                    {' '}
                    <div>Read</div>{' '}
                </div>{' '}
            </a>{' '}
        </div>
    );
}

export function PressSection() {
    return (
        <section className="section is--white z--2" data-press-section="">
            {' '}
            <div className="main-c p-pad">
                {' '}
                <div className="v-128" />{' '}
                <div className="text-align-center">
                    {' '}
                    <h3 className="h-large is--alt sm--small">press</h3>{' '}
                </div>{' '}
                <div className="swiper press w-dyn-list">
                    {' '}
                    <div className="swiper-wrapper w-dyn-items" role="list">
                        {' '}
                        {PRESS_QUOTES.map((item) => (
                            <PressSlide key={item.outlet} item={item} />
                        ))}{' '}
                    </div>{' '}
                </div>{' '}
                <SliderArrows control="press" />{' '}
                <div className="v-200 sm-64" />{' '}
            </div>{' '}
        </section>
    );
}
