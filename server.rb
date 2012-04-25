require 'sinatra'

set :public_folder, '/app'

get '/' do
  File.read(File.join('app', 'index.html'))
end


