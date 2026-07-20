import { Fragment } from 'react';

import { SOCIAL_CHANNELS, type SocialChannel } from './home.data';
import { SliderArrows } from './slider-arrows';

function SocialSlide({ item }: { item: SocialChannel }) {
    return (
        <div className="swiper-slide coverflow">
            {' '}
            <div className="flex-h j--between">
                {' '}
                <div className="p-reg">{item.name}</div>{' '}
                <div className="icon-med">
                    {' '}
                    <svg
                        fill="none"
                        viewBox={item.viewBox}
                        width="100%"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {' '}
                        <path
                            {...(item.evenodd ? { clipRule: 'evenodd', fillRule: 'evenodd' } : {})}
                            d={item.path}
                            fill="currentColor"
                        />{' '}
                    </svg>{' '}
                </div>{' '}
            </div>{' '}
            <a
                className="button is--social w-inline-block"
                href="#"
                data-external-disabled="true"
                target="_blank"
            >
                {' '}
                <div className="flex-h gap--tiny" tradel-loader="">
                    {' '}
                    <p className="new-button_label">Join</p>{' '}
                    <div className="highlight-blocks">
                        {' '}
                        <div className="highlight" /> <div className="highlight" />{' '}
                        <div className="highlight" /> <div className="highlight" />{' '}
                        <div className="highlight" />{' '}
                    </div>{' '}
                    <p className="new-button_label">us</p>{' '}
                </div>{' '}
            </a>{' '}
            <div className="card-center">
                {' '}
                <div className="h-med">
                    {item.count}
                    <span className="social-plus">+</span>
                </div>{' '}
                <div className="v-16" />{' '}
                {item.caption && (
                    <>
                        <p className="p-reg is--alt">{item.caption}</p>{' '}
                    </>
                )}
            </div>{' '}
        </div>
    );
}

export function CommunitySection() {
    return (
        <section className="section is--white">
            {' '}
            <div className="main-c p-pad">
                {' '}
                <div className="v-160" />{' '}
                <div className="row sm--text__center">
                    {' '}
                    <div className="col col-lg-1 sm--hide" />{' '}
                    <div className="col col-lg-7">
                        {' '}
                        <h4 className="h-med">
                            {' Evolve '}
                            <span className="is--alt">with</span>
                            {'  us '}
                        </h4>{' '}
                    </div>{' '}
                    <div className="col col-lg-3 col-sm-12">
                        {' '}
                        <p className="p-reg">
                            Join our community to stay up to date with the latest news and enjoy
                            free educational trading resources.
                        </p>{' '}
                    </div>{' '}
                    <div className="col col-lg-1 sm--hide" />{' '}
                </div>{' '}
                <div className="swiper coverflow">
                    {' '}
                    <div className="swiper-wrapper coverflow">
                        {' '}
                        {SOCIAL_CHANNELS.map((item) => (
                            <Fragment key={item.name}>
                                <SocialSlide item={item} />{' '}
                            </Fragment>
                        ))}
                    </div>{' '}
                </div>{' '}
                <SliderArrows control="coverflow" /> <div className="v-160 sm--hide" />{' '}
            </div>{' '}
        </section>
    );
}
