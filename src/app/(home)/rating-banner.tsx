import { Fragment } from 'react';

import { REVIEWS, type Review } from './home.data';

const STAR_PATH =
    'M16.0011 23.0265L21.5344 26.3732C22.5477 26.9865 23.7877 26.0799 23.5211 24.9332L22.0544 18.6398L26.9477 14.3999C27.8411 13.6265 27.3611 12.1599 26.1877 12.0665L19.7477 11.5199L17.2277 5.57318C16.7744 4.49318 15.2277 4.49318 14.7744 5.57318L12.2544 11.5065L5.81441 12.0532C4.64107 12.1465 4.16107 13.6132 5.05441 14.3865L9.94774 18.6265L8.48107 24.9199C8.21441 26.0665 9.45441 26.9732 10.4677 26.3599L16.0011 23.0265Z';

const BANNER_ITEMS = ['Rating', '4.3', '/', 'Rating', '4.3', '/', 'Rating', '4.3', '/'];

function BannerText() {
    return (
        <div className="banner-text">
            {' '}
            {BANNER_ITEMS.map((item, index) => (
                <Fragment key={index}>
                    <div className="h-cta">{item}</div>{' '}
                </Fragment>
            ))}
        </div>
    );
}

function ReviewSlide({ review }: { review: Review }) {
    return (
        <div className="swiper-slide reviews w-dyn-item swiper-slide-prev" role="listitem">
            {' '}
            <div className="rating-card">
                {'  '}
                <div className="flex-h j--between wrap">
                    {'  '}
                    <div className="flex-h gap--xsmall">
                        {'  '}
                        <div className="rating-cube" />{' '}
                        <div className="rating-top">{review.name}</div>
                        {'  '}
                    </div>{' '}
                    <div className="flex-h gap--xsmall">
                        {'  '}
                        <svg
                            className="rating-star u-hide"
                            fill="none"
                            viewBox="0 0 32 32"
                            width="100%"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {' '}
                            <path d={STAR_PATH} fill="#3AFFA3" />{' '}
                        </svg>{' '}
                        <div className="rating-top">{review.date}</div>
                        {'  '}
                    </div>
                    {'  '}
                </div>{' '}
                <p className="p-small color--grey">{review.text}</p>
                {'  '}
            </div>{' '}
        </div>
    );
}

export function RatingBanner() {
    return (
        <section className="section" data-visible="false">
            {' '}
            <div className="v-300" />{' '}
            <div className="banner-wrap">
                {' '}
                <BannerText /> <BannerText />{' '}
            </div>{' '}
            <div className="swiper reviews w-dyn-list">
                {' '}
                <div className="swiper-wrapper reviews w-dyn-items" role="list">
                    {' '}
                    {REVIEWS.map((review) => (
                        <ReviewSlide key={review.name} review={review} />
                    ))}{' '}
                </div>{' '}
            </div>{' '}
            <div className="v-300 sm--200" />{' '}
        </section>
    );
}
