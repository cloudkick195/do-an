import Schema from 'mongoose';

interface ICategory{
    title: string;
    content?: string;
    image?: string,
    slug?: string,
}

export default ICategory;