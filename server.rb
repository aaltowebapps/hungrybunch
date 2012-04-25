require 'sinatra'

set :public_folder, settings.root

get '/' do
  send_file 'app/index.new.html'
end


