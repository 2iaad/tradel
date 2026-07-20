import { ACADEMY_POSTS, NEWS_POSTS, type BlogPost } from './home.data';

const READ_ARROW_PATH =
    'M6.34998 0.0313994L8.12789 1.80931L7.61549 2.3217L8.12595 2.83216L7.61355 3.34456L8.12053 3.85154L7.60463 4.36744L8.11161 4.87443L7.59921 5.38682L8.10619 5.8938L7.07789 6.92211L6.57091 6.41513L7.08682 5.89922L6.57983 5.39224L7.09223 4.87984L6.58525 4.37286L7.09765 3.86046L6.58719 3.35001L7.1031 2.8341L6.59612 2.32712L1.46162 7.46162L0.701145 6.70115L5.83564 1.56665L5.32519 1.05619L4.80928 1.5721L4.3023 1.06512L3.7899 1.57751L3.28292 1.07053L2.77052 1.58293L2.26007 1.07248L1.74416 1.58838L1.23718 1.0814L2.26549 0.0530973L2.77247 0.560079L3.28486 0.0476821L3.79532 0.558136L4.31122 0.0422299L4.81821 0.549212L5.3306 0.0368145L5.83759 0.543796L6.34998 0.0313994Z';

function ReadArrow({ variant }: { variant: 'is--main' | 'is--dup' }) {
    return (
        <svg
            className={`read-cta__arrow ${variant}`}
            fill="none"
            viewBox="0 0 9 8"
            width="100%"
            xmlns="http://www.w3.org/2000/svg"
        >
            {' '}
            <path d={READ_ARROW_PATH} fill="currentColor" />{' '}
        </svg>
    );
}

function BlogCard({ post, kind }: { post: BlogPost; kind: 'news' | 'academy' }) {
    return (
        <div className="blog-link w-dyn-item" data-blog-card={kind} role="listitem">
            {' '}
            <a className="blog-link__cta w-inline-block" href="#" ratio="square">
                {' '}
                <div className="blog-link__img">
                    {'  '}
                    <img
                        alt={post.title}
                        className="cover-img anim is-wide"
                        loading="lazy"
                        src={post.image}
                    />{' '}
                    <img alt={post.title} className="cover-img anim" loading="lazy" src={post.image} />
                    {'  '}
                    <div className="blog-link__pills">
                        {' '}
                        <div className="pill is--black">{post.date}</div>{' '}
                        {post.category && (
                            <>
                                <div className="pill is--black" data-filter="category">
                                    {` ${post.category} `}
                                </div>{' '}
                            </>
                        )}
                    </div>{' '}
                </div>{' '}
                <div className="blog-link__title">
                    {' '}
                    <h4 className="p-large">{post.title}</h4>{' '}
                </div>{' '}
                <div className="read-cta">
                    {' '}
                    <div className="p-reg">read</div>{' '}
                    <div className="read-cta__dot">
                        {'  '}
                        <ReadArrow variant="is--main" /> <ReadArrow variant="is--dup" />
                        {'  '}
                    </div>{' '}
                </div>{' '}
            </a>{' '}
        </div>
    );
}

export function EducationSection() {
    return (
        <section className="section is--white">
            {' '}
            <div className="main-c p-pad">
                {' '}
                <div className="v-160" />{' '}
                <div className="flex-v a--center">
                    {' '}
                    <div className="text-align-center">
                        {' '}
                        <h3 className="h-large is--alt sm--small">EDUCATION</h3>{' '}
                        <div className="v-32" />{' '}
                    </div>{' '}
                    <div className="blog-toggle">
                        {' '}
                        <span className="blog-toggle__link active w-inline-block">
                            {' '}
                            <div className="new-button_label">Blog</div>{' '}
                        </span>{' '}
                        <span className="blog-toggle__link w-inline-block">
                            {' '}
                            <div className="new-button_label">academy</div>{' '}
                        </span>{' '}
                    </div>{' '}
                </div>{' '}
                <div className="row">
                    {' '}
                    <div className="col md--hide" />{' '}
                    <div className="col col-lg-10 col-md-12">
                        {' '}
                        <div className="toggle-content">
                            {' '}
                            <div className="toggle-news__wrap w-dyn-list">
                                {' '}
                                <div className="three-col__grid sm--stack w-dyn-items" role="list">
                                    {' '}
                                    {NEWS_POSTS.map((post) => (
                                        <BlogCard key={post.title} kind="news" post={post} />
                                    ))}{' '}
                                </div>{' '}
                            </div>{' '}
                            <div className="toggle-academy__wrap w-dyn-list">
                                {' '}
                                <div className="three-col__grid sm--stack w-dyn-items" role="list">
                                    {' '}
                                    {ACADEMY_POSTS.map((post) => (
                                        <BlogCard key={post.title} kind="academy" post={post} />
                                    ))}{' '}
                                </div>{' '}
                            </div>{' '}
                        </div>{' '}
                    </div>{' '}
                    <div className="col md--hide" />{' '}
                </div>{' '}
                <div className="v-100" />{' '}
                <div className="flex-v a--center">
                    {' '}
                    <a
                        className="button is--large w-inline-block"
                        data-wf--bigbutton--variant="base"
                        href="#"
                        scramble-link=""
                    >
                        {' '}
                        <div className="button-bg" />{' '}
                        <div className="new-button_label is--large" scramble-text="">
                            all articles
                        </div>{' '}
                    </a>{' '}
                </div>{' '}
                <div className="v-160" />{' '}
            </div>{' '}
        </section>
    );
}
